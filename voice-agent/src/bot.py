"""
Pipecat Voice Bot Pipeline (v2.0.0)
Single-service speech-to-speech via Gemini Live (STT + LLM + TTS unified).
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
from pipecat.processors.frameworks.rtvi import RTVIObserver, RTVIProcessor
from pipecat.services.google.gemini_live.llm import (
    GeminiLiveLLMService,
    GeminiModalities,
    GeminiVADParams,
)
from pipecat.transports.daily.transport import DailyParams, DailyTransport


async def run_voice_bot(
    room_url: str,
    token: Optional[str] = None,
    system_prompt: Optional[str] = None,
    language: str = "bg-BG",
    greeting: Optional[str] = None,
):
    """
    Main bot entry point. Connects to a Daily.co room and runs the voice pipeline.

    Args:
        room_url: Daily.co room URL
        token: optional meeting token for the bot
        system_prompt: localized system instruction
        language: BCP-47 language tag (e.g. "bg-BG", "en-US", "ro-RO")
        greeting: developer message used to trigger the opening line in that language
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

    # ─── Single speech-to-speech service ─────────────────────────────────────
    # Gemini Live handles STT + LLM + TTS natively in one streaming connection.
    # NOTE: the native-audio model auto-detects language from the system prompt
    # and rejects explicit BCP-47 codes it doesn't whitelist (e.g. "bg-BG" →
    # error 1007 "Unsupported language code"). So we do NOT pass `language`; the
    # localized system_instruction + greeting drive the spoken language instead.
    llm = GeminiLiveLLMService(
        api_key=os.getenv("GOOGLE_API_KEY", ""),
        settings=GeminiLiveLLMService.Settings(
            model="models/gemini-2.5-flash-native-audio-preview-12-2025",
            system_instruction=system_prompt or _default_system_prompt(),
            voice="Aoede",  # warm, conversational — best fit for AgroTrade onboarding
            modalities=GeminiModalities.AUDIO,
            temperature=0.7,
            vad=GeminiVADParams(silence_duration_ms=500),
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
    # No separate STT/TTS — Gemini Live consumes audio in and emits audio out.
    pipeline = Pipeline(
        [
            transport.input(),      # User audio in
            rtvi,                   # RTVI protocol handler (mobile client depends on this)
            user_aggregator,        # Collect user transcription (from Gemini)
            llm,                    # Gemini Live: audio-in → audio-out
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
        observers=[RTVIObserver(rtvi)],
    )

    # ─── Event handlers ──────────────────────────────────────────────────────
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"[bot v2.1 no-lang] Client connected: {client} (req_lang={language})")
        context.add_message(
            {
                "role": "developer",
                "content": greeting
                or "Please greet the user warmly in their language and ask how you can help them today.",
            }
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
