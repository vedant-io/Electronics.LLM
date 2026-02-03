import sys
from pathlib import Path
import asyncio
import logging
import json
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.runners import InMemoryRunner

# Add backend root to PYTHONPATH
PROJECT_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PROJECT_ROOT))

# Import the existing agent
from app.Beginner.Dynamic_agent.adaptive_agent import root_agent, DEFAULT_PROMPT
from app.Beginner.utils import retry_config

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DynamicReviewRunner")

# ---------------------------------------------------------
# Define the Strict Reviewer Agent
# ---------------------------------------------------------
reviewer_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",
        retry_config=retry_config,
    ),
    name="strict_qc_auditor",
    description="Strict Quality Control Auditor for Technical Documentation.",
    instruction="""You are a **Chief Technical Engineer and Quality Auditor** known for your extreme attention to detail and zero-tolerance for inaccuracy.

    You will receive a set of generated learning modules for an electronics project.
    
    Your Audit Checklist:
    1.  **Hallucination Check (CRITICAL):** The content claims to use "Retrieved Resources". Does the text actually reflect widely known facts about the components mentioned? If it makes up pinouts or specs that don't exist for the standard parts (e.g. Arduino Uno, HC-05, L298N), FAIL IT.
    2.  **Hardware Reality:** Are the connections physically possible? (e.g. connecting 5V sensor to 3.3V pin without logic shifting).
    3.  **Safety:** Are there warnings for power/grounding?
    4.  **Pedagogical Quality:** Is it actually explaining "how" it works, or just giving instructions? The goal is *deep understanding*.
    5.  **Schema Compliance:** Is the output valid JSON structure as requested?

    **Output Format (Markdown):**

    ## 🚨 STRICT QUALITY AUDIT REPORT

    **PASS / FAIL Status:** [PASS / FAIL]
    **Technical Accuracy Score:** 0/100

    ### 🛑 Critical Failures (If any)
    * [List any dangerous errors or hallucinations]

    ### ⚠️ Technical Observations
    * **[Module Name]:** [Specific Critique]
    * ...

    ### ✅ Compliance Checks
    * [ ] Valid JSON Output?
    * [ ] Real Resources Cited?
    * [ ] Safety Warnings Present?

    ### 📋 Final Verdict & Recommendations
    [Summary paragraph]
    """,
)

# ---------------------------------------------------------
# Formatting Helper
# ---------------------------------------------------------
def format_modules_output(agent_response: dict) -> str:
    """
    Takes the raw JSON output from the agent and formats it into
    clean, readable Markdown for display.
    """
    try:
        # Looking for 'adaptive_modules' key from the final agent in the chain
        modules_data = agent_response.get("adaptive_modules")
        
        # If not found directly, it might be nested or named differently in the state?
        if not modules_data:
             # Fallback: check if we just got a list or key "modules" (legacy)
             modules_data = agent_response.get("modules")
        
        if not modules_data:
             return f"⚠️ Could not find 'adaptive_modules' in response keys: {list(agent_response.keys())}\nRaw Response: {agent_response}"

        # If it's a string (JSON string), parse it
        if isinstance(modules_data, str):
             # Remove markdown code blocks if present
             clean_json = modules_data.replace("```json", "").replace("```", "").strip()
             try:
                data = json.loads(clean_json)
             except json.JSONDecodeError:
                return f"⚠️ JSON Decode Error on string: {clean_json[:500]}..."
        else:
            data = modules_data

        # Data should be wrapped in {"modules": [...]} based on prompt
        if isinstance(data, dict) and "modules" in data:
            module_list = data["modules"]
        elif isinstance(data, list):
            module_list = data
        else:
            return f"Error parsing modules: Unknown structure {type(data)} - {data}"

        # Build Markdown
        md_output = "# 🛠️ Generated Project Modules\n\n"
        
        for idx, mod in enumerate(module_list, 1):
            title = mod.get("title", "Untitled")
            subtitle = mod.get("subtitle", "")
            content = mod.get("content", "No content provided.")
            resources = mod.get("resources", [])
            
            md_output += f"## {idx}. {title}\n"
            if subtitle:
                md_output += f"*{subtitle}*\n"
            md_output += f"\n{content}\n\n"
            
            if resources:
                md_output += "**📚 Referenced Resources:**\n"
                for res in resources:
                    if isinstance(res, dict):
                         name = res.get("name", "Link")
                         url = res.get("url", "#")
                         md_output += f"- [{name}]({url})\n"
                    else:
                         md_output += f"- {res}\n"
            md_output += "\n---\n\n"
            
        return md_output

    except Exception as e:
        return f"Error formatting output: {str(e)}\nRaw Response keys: {list(agent_response.keys()) if isinstance(agent_response, dict) else 'Not Dict'}"


# ---------------------------------------------------------
# Main Execution
# ---------------------------------------------------------
async def run_review_pipeline():
    print("🚀 Starting Dynamic Agent Pipeline (Project: Smart Dustbin)...")
    
    # 1. Run the original generation agent
    runner = InMemoryRunner(agent=root_agent)
    
    # result_state is actually a list of events from run_debug
    events_list = await runner.run_debug(DEFAULT_PROMPT)
    
    # result_state is actually a list of events from run_debug
    events_list = await runner.run_debug(DEFAULT_PROMPT)
    
    # Extract the final JSON from the adaptive_modules_agent
    final_json_text = ""
    target_author = "adaptive_modules_agent"
    
    # Iterate FORWARD to reconstruct streaming text correctly
    for event in events_list:
        # Check author (sometimes role is used, but author usually holds agent name)
        author = getattr(event, 'author', '')
        role = getattr(event, 'role', '')
        
        # We want the output from the specific sub-agent
        if author == target_author or (role == 'model' and not author): 
             # Fallback: if author is missing, we might assume last model output is it.
             # But let's try strict author first, or verify via logs.
             # Actually, let's just capture ALL model output and take the LAST valid JSON block?
             # Or better: accumulate text for the target author.
             
             if author == target_author:
                 if hasattr(event, 'content') and hasattr(event.content, 'parts'):
                     for part in event.content.parts:
                         if hasattr(part, 'text') and part.text:
                             final_json_text += part.text
    
    # If final_json_text is empty, maybe the author was different?
    # Let's try capturing the LAST model response genericly if specific fails.
    if not final_json_text.strip():
        print("⚠️ Warning: Could not find output for 'adaptive_modules_agent'. Trying last model response.")
        current_model_text = ""
        for event in events_list:
             role = getattr(event, 'role', '') or getattr(event, 'author', '') # fallback
             if role == 'model' or role == target_author:
                 if hasattr(event, 'content') and hasattr(event.content, 'parts'):
                     for part in event.content.parts:
                         if hasattr(part, 'text') and part.text:
                             current_model_text += part.text
             elif role == 'user' or role == 'system':
                 # New turn, reset? No, SequentialAgent accumulates.
                 # Actually, we want the LAST block of model text.
                 # Getting tricky. Let's rely on the previous logic but FORWARD.
                 pass
        
        # Heuristic: The last agent runs last. So the text at the end of the stream should be it.
        # But we need to separate it from previous agents.
        # Let's assume the previous agents output JSON too.
        # We can look for the last occurrence of "modules": [ ... ]
        final_json_text = current_model_text

    # 2. Format the output
    print(f"\n✅ Generation Complete. Extracted Text Length: {len(final_json_text)}")
    
    # Create a mock state dict for our formatter
    mock_state = {"adaptive_modules": final_json_text}
    formatted_content = format_modules_output(mock_state)
    
    print("="*60)
    print(formatted_content)
    print("="*60)
    
    # 3. Run the Reviewer
    print("\n🧐 Sending to STRICT QC AUDITOR...\n")
    
    reviewer_runner = InMemoryRunner(agent=reviewer_agent)
    review_events = await reviewer_runner.run_debug(formatted_content)
    
    print("\n" + "="*60)
    print("AUDIT REPORT:")
    
    # Print reviewer output
    for event in review_events:
        role = getattr(event, 'role', '') or getattr(event, 'author', '')
        if role == 'model' and hasattr(event, 'content'):
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        print(part.text, end="")
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(run_review_pipeline())
