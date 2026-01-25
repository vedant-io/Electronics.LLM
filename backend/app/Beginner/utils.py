import asyncio
import logging
from google.genai import types
from google.adk.runners import InMemoryRunner

logger = logging.getLogger("BeginnerUtils")

retry_config = types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504], # Retry on these HTTP errors
)

def extract_text_from_events(events) -> str:
    """
    Safely extract model-generated text from ADK event stream.
    Handles None content and unexpected event shapes.
    """
    chunks = []

    for event in events:
        # Skip user echoes
        role = getattr(event, "role", None) or getattr(event, "author", None)
        if role == "user":
            continue

        content = getattr(event, "content", None)
        if not content:
            continue

        parts = getattr(content, "parts", None)
        if not parts:
            continue

        for part in parts:
            text = getattr(part, "text", None)
            if text:
                chunks.append(text)

    return "".join(chunks).strip()

async def run_agent(
    agent,
    prompt: str,
    timeout: int = 60,
):
    """
    Generic agent runner without JSON validation.
    """
    runner = InMemoryRunner(agent=agent)

    logger.info("▶️ Running agent...")
    try:
        events = await asyncio.wait_for(
            runner.run_debug(prompt, quiet=True),
            timeout=timeout,
        )
        
        output_text = extract_text_from_events(events)
        logger.info("✅ Agent completed successfully")
        return output_text
        
    except Exception as e:
        logger.error(f"❌ Agent execution failed: {e}")
        raise e
