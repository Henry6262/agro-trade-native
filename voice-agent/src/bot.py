"""
Pipecat Voice Bot Pipeline (v1.2.1)
Orchestrates Deepgram STT → Gemini LLM → Cartesia TTS
"""

import os
import asyncio
from typing import Optional

from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.processors.frameworks.rtvi import RTVIProcessor
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.google.llm import GoogleLLMService
from pipecat.transports.daily.transport import DailyParams, DailyTransport


async def run_voice_bot(
    room_url: str,
    token: Optional[str] = None,
    system_prompt: Optional[str] = None,
):
    """
    Main bot entry point. Connects to a Daily.co room and runs the voice pipeline.
    """

    # ─── Transport ───────────────────────────────────────────────────────────
    transport = DailyTransport(
        room_url,
        token,
        "AgroTrade AI Assistant",
        DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            camera_out_enabled=False,
            vad_analyzer=SileroVADAnalyzer(),
        ),
    )

    # ─── Services ────────────────────────────────────────────────────────────
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY", ""))

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY", ""),
        settings=CartesiaTTSService.Settings(
            voice="71a7ad14-091c-4e8e-a314-022ece01c121",  # Bulgarian-optimized voice
        ),
    )

    llm = GoogleLLMService(
        api_key=os.getenv("GOOGLE_API_KEY", ""),
        settings=GoogleLLMService.Settings(
            system_instruction=system_prompt or _default_system_prompt(),
            temperature=0.7,
        ),
    )

    # ─── Context & Aggregators ───────────────────────────────────────────────
    context = LLMContext()
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
    )

    # ─── RTVI (Real-Time Voice Inference) ────────────────────────────────────
    rtvi = RTVIProcessor()

    # ─── Pipeline ────────────────────────────────────────────────────────────
    pipeline = Pipeline(
        [
            transport.input(),      # User audio in
            rtvi,                   # RTVI protocol handler (mobile client depends on this)
            stt,                    # Speech-to-text
            user_aggregator,        # Collect user transcription
            llm,                    # Language model
            tts,                    # Text-to-speech
            transport.output(),     # Bot audio out
            assistant_aggregator,   # Collect assistant response
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    # ─── Event handlers ──────────────────────────────────────────────────────
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected: {client}")
        context.add_message(
            {"role": "developer", "content": "Please greet the user in Bulgarian and ask how you can help them today."}
        )
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Client disconnected: {client}")
        await task.cancel()

    # ─── Run ─────────────────────────────────────────────────────────────────
    runner = PipelineRunner()
    await runner.run(task)


def _default_system_prompt() -> str:
    return """Ти със AI асистент за AgroTrade — мобилно приложение за търговия със селскостопанска продукция в България.

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
