
import json
import logging

logger = logging.getLogger("OutputStructurer")

async def structure_beginner_output(output_text: str) -> str:
    """
    Cleans and structures the raw output from the beginner agents.
    Removes markdown code blocks and excess whitespace.
    """
    if not output_text:
        return ""

    # Remove markdown code blocks ```json ... ``` or just ``` ... ```
    cleaned = output_text.strip()
    
    if cleaned.startswith("```"):
        # Find first newline
        first_newline = cleaned.find("\n")
        if first_newline != -1:
            # Remove first line (```json)
            cleaned = cleaned[first_newline+1:]
        
        # Remove trailing ```
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
            
    return cleaned.strip()
