"""
Pipecat Voice Bot Pipeline
Orchestrates Deepgram STT → Gemini LLM → Cartesia TTS
"""

import os
import asyncio
from typing import Optional

from pipecat.frames.frames import LLMFullResponseEndFrame, TextFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_response import (
    LLMAssistantResponseAggregator,
    LLMUserResponseAggregator,
)
from pipecat.processors.frameworks.rtvi import RTVIObserver, RTVIProcessor
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.google.llm import GoogleLLMService
from pipecat.transports.base_transport import BaseTransport
from pipecat.transports.services.daily import DailyParams, DailyTransport

from loguru import logger


async def run_voice_bot(
    room_url: str,
    token: Optional[str] = None,
    system_prompt: Optional[str] = None,
):
    """
    Main bot entry point. Connects to a Daily.co room and runs the voice pipeline.
    """
    transport = DailyTransport(
        room_url,
        token,
        "AgroTrade AI Assistant",
        DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            camera_out_enabled=False,
            vad_enabled=True,
            vad_analyzer=None,  # Uses default Silero VAD
        ),
    )

    # ─── Services ────────────────────────────────────────────────────────────
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY", ""))

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY", ""),
        voice_id="71a7ad14-091c-4e8e-a314-022ece01c121",  # Bulgarian-optimized voice
        params=CartesiaTTSService.InputParams(
            language="bg",  # Bulgarian
            speed="normal",
            emotion=["positivity:high"],
        ),
    )

    llm = GoogleLLMService(
        api_key=os.getenv("GOOGLE_API_KEY", ""),
        model="gemini-2.0-flash-lite",
        params=GoogleLLMService.InputParams(
            temperature=0.7,
            max_tokens=1024,
        ),
    )

    # ─── System prompt ───────────────────────────────────────────────────────
    default_prompt = """Ти със AI асистент за AgroTrade — мобилно приложение за търговия със селскостопанска продукция в България.

Твоите потребители са български фермери, купувачи и превозвачи. Много от тях не са технически грамотни и предпочитат да говорят вместо да пишат.

**Твоята роля:**
- Помагаш на фермерите да създадат оферти за пшеница, царевица, слънчоглед и други култури
- Помагаш на купувачите да направят заявки
- Помагаш на превозвачите да регистрират камионите си
- Отговаряш на въпроси за цени, пазари и транспорт

**Правила:**
- Говори само на български език
- Бъди кратък и ясен
- Когато потребител каже количество или цена, повтори го за потвърждение
- Преди да извършиш действие (създаване на оферта и т.н.), поискай потвърждение
- Ако не разбереш нещо, помоли потребителя да повтори
- Числата ги предавай като цифри, не като думи

**Формат за действия:**
Когато искаш да извършиш действие в приложението, изпрати JSON в следния формат:
```action
{
  "action": "create_offer|create_request|navigate|update_profile|confirm|cancel",
  "params": { ... }
}
```
"""

    messages = [
        {
            "role": "system",
            "content": system_prompt or default_prompt,
        }
    ]

    # ─── Context aggregators ─────────────────────────────────────────────────
    context_aggregator = LLMAssistantResponseAggregator(messages)
    user_aggregator = LLMUserResponseAggregator(messages)

    # ─── RTVI (Real-Time Voice Inference) ────────────────────────────────────
    rtvi = RTVIProcessor()

    # ─── Pipeline ────────────────────────────────────────────────────────────
    pipeline = Pipeline(
        [
            transport.input(),      # User audio in
            rtvi,                   # RTVI protocol handler
            stt,                    # Speech-to-text
            user_aggregator,        # Collect user transcription
            llm,                    # Language model
            tts,                    # Text-to-speech
            transport.output(),     # Bot audio out
            context_aggregator,     # Collect assistant response
        ]
    )

    task = PipelineTask(
        pipeline,
        PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    # ─── Event handlers ──────────────────────────────────────────────────────
    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        logger.info(f"Participant joined: {participant['id']}")
        # Kick off the conversation with a greeting
        await task.queue_frames([TextFrame("Здравейте! Аз съм вашият AI асистент за AgroTrade. Как мога да ви помогна днес?")])

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant left: {participant['id']}, reason: {reason}")
        await task.cancel()

    # ─── Run ─────────────────────────────────────────────────────────────────
    runner = PipelineRunner()
    await runner.run(task)
