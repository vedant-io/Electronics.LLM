import asyncio

async def run_agent_with_retry(runner, prompt, retries=3, delay=20):
    """
    Executes an agent with retry logic for handling API rate limits (429).
    """
    for attempt in range(retries):
        try:
            # Run the agent
            result = await runner.run_debug(prompt)
            return result
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                print(f"⚠️ Rate limit hit. Waiting {delay}s before retry {attempt+1}/{retries}...")
                await asyncio.sleep(delay)
            else:
                # If it's not a rate limit error, raise it immediately
                print(f"❌ Agent execution error: {e}")
                raise e
    
    raise Exception("Max retries exceeded for agent execution.")
