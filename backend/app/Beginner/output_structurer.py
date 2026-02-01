import logging
import json
from google.adk.models.google_llm import Gemini
from google.adk.agents import LlmAgent
from app.Beginner.utils import retry_config, run_agent
import asyncio

logger = logging.getLogger("OutputStructurer")

# Define the agent using the ADK pattern
structurer_agent = LlmAgent(
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_config=retry_config,
    ),
    name="output_structurer",
    description="Helper agent to extract structured JSON from verbose text.",
    instruction="""You are a data extraction assistant. 
Your sole purpose is to extract a valid JSON object starting with { "modules": ... } from the input text.
Ignore all reasoning, logs, or intermediate text.
Return ONLY valid JSON.
"""
)

async def structure_beginner_output(text: str) -> str:
    """
    Takes potentially verbose output from the Beginner agents (which might include 
    intermediate steps) and extracts ONLY the final valid JSON object containing 
    the 'modules' list.
    """
    logger.info("🧹 Structuring beginner agent output...")
    
    prompt = f"""
    The following text contains a mix of reasoning, search results, and a final JSON object.
    Your job is to ignore everything else and extract ONLY the final JSON object.
    
    The JSON object we are looking for should have a key "modules" which is a list.
    
    Input Text:
    {text}
    
    Output Format:
    Return ONLY the valid JSON string. Do not wrap it in markdown code blocks.
    If the JSON is invalid or missing, try to repair it or return an empty valid JSON structure like {{ "modules": [] }}.
    """

    try:
        # Use the standard run_agent helper which handles the runner and event loop
        # Increase timeout to handle large context processing
        response_text = await run_agent(structurer_agent, prompt, timeout=120)
        
        # Simple cleanup in case the LLM adds markdown code blocks
        clean_json = response_text.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        elif clean_json.startswith("```"):
            clean_json = clean_json[3:]
            
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
            
        clean_json = clean_json.strip()
        
        # Verify it parses
        try:
            json.loads(clean_json)
            logger.info("✅ Output successfully structured")
            return clean_json
        except json.JSONDecodeError:
            logger.warning("⚠️ Extracted text was not valid JSON, returning best effort")
            return clean_json

    except Exception as e:
        import traceback
        logger.error(f"❌ Structuring failed: {e}")
        logger.error(traceback.format_exc())
        return text # Fallback to original if completely failed
