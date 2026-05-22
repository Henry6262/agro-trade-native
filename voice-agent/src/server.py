"""
FastAPI server for AgroTrade Voice AI
Handles bot spawning, room creation, and RTVI messaging.
"""

import os
import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import Optional

import aiohttp
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from loguru import logger

from .bot import run_voice_bot

load_dotenv()

# ─── Configuration ───────────────────────────────────────────────────────────
DAILY_API_KEY = os.getenv("DAILY_API_KEY", "")
DAILY_API_URL = os.getenv("DAILY_API_URL", "https://api.daily.co/v1")
MAX_SESSION_MINUTES = int(os.getenv("MAX_SESSION_MINUTES", "15"))

# ─── Active bot tasks ────────────────────────────────────────────────────────
active_bots: dict[str, asyncio.Task] = {}


# ─── Daily.co API helpers ────────────────────────────────────────────────────
async def create_daily_room(room_name: str, expire_seconds: int) -> str:
    """Create a private Daily.co room."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{DAILY_API_URL}/rooms",
            headers={"Authorization": f"Bearer {DAILY_API_KEY}"},
            json={
                "name": room_name,
                "privacy": "private",
                "properties": {
                    "exp": int(asyncio.get_event_loop().time()) + expire_seconds,
                    "enable_screenshare": False,
                    "enable_chat": False,
                    "start_video_off": True,
                    "start_audio_off": False,
                },
            },
        ) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise HTTPException(status_code=500, detail=f"Daily room creation failed: {text}")
            data = await resp.json()
            return data["url"]


async def create_daily_token(room_name: str, expire_minutes: int) -> str:
    """Create a meeting token for the room."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{DAILY_API_URL}/meeting-tokens",
            headers={"Authorization": f"Bearer {DAILY_API_KEY}"},
            json={
                "properties": {
                    "room_name": room_name,
                    "is_owner": False,
                    "exp": int(asyncio.get_event_loop().time()) + expire_minutes * 60,
                },
            },
        ) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise HTTPException(status_code=500, detail=f"Daily token creation failed: {text}")
            data = await resp.json()
            return data["token"]


# ─── Pydantic models ─────────────────────────────────────────────────────────
class StartSessionRequest(BaseModel):
    role: str = Field(..., description="User role: seller, buyer, or transporter")
    mode: str = Field(default="assistant", description="Session mode: onboarding or assistant")
    language: str = Field(default="bg", description="Language code")


class StartSessionResponse(BaseModel):
    room_url: str
    token: str
    session_id: str


class SessionStatus(BaseModel):
    session_id: str
    active: bool
    participants: int


# ─── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AgroTrade Voice AI starting up...")
    yield
    logger.info("🛑 Shutting down, cancelling active bots...")
    for task in active_bots.values():
        task.cancel()


# ─── FastAPI app ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="AgroTrade Voice AI",
    description="Real-time voice assistant for Bulgarian farmers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "agrotrade-voice-ai"}


@app.post("/start", response_model=StartSessionResponse)
async def start_session(
    request: StartSessionRequest,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(None),
):
    """
    Create a new Daily.co room and spawn a Pipecat bot.
    Returns room_url + token for the client to join.
    """
    try:
        # Create a Daily room
        room_name = f"agrotrade-{uuid.uuid4().hex[:12]}"
        expire_seconds = MAX_SESSION_MINUTES * 60
        room_url = await create_daily_room(room_name, expire_seconds)

        # Create a meeting token for the client
        token = await create_daily_token(room_name, MAX_SESSION_MINUTES)

        session_id = uuid.uuid4().hex

        # Spawn the bot in the background
        bot_task = asyncio.create_task(
            run_voice_bot(
                room_url=room_url,
                token=None,  # Bot uses API key, not token
            ),
            name=f"bot-{session_id}",
        )
        active_bots[session_id] = bot_task

        # Clean up when bot finishes
        def cleanup_task(t):
            active_bots.pop(session_id, None)
            if t.exception():
                logger.error(f"Bot {session_id} failed: {t.exception()}")
            else:
                logger.info(f"Bot {session_id} completed")

        bot_task.add_done_callback(cleanup_task)

        logger.info(f"✅ Session {session_id} started for role={request.role}, mode={request.mode}")

        return StartSessionResponse(
            room_url=room_url,
            token=token,
            session_id=session_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/session/{session_id}", response_model=SessionStatus)
async def get_session_status(session_id: str):
    """Check if a bot session is still active."""
    task = active_bots.get(session_id)
    active = task is not None and not task.done()
    return SessionStatus(
        session_id=session_id,
        active=active,
        participants=1 if active else 0,
    )


@app.delete("/session/{session_id}")
async def end_session(session_id: str):
    """Forcefully end a bot session."""
    task = active_bots.pop(session_id, None)
    if task and not task.done():
        task.cancel()
        logger.info(f"🛑 Session {session_id} cancelled by user")
        return {"status": "cancelled", "session_id": session_id}
    return {"status": "not_found", "session_id": session_id}


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
