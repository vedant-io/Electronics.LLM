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
from app.Beginner.Basics_agent.main import root_agent, DEFAULT_PROMPT, retry_config

# Import shared utils (assuming they exist or are accessible)
# from app.Beginner.utils import retry_config 

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ReviewRunner")

# ---------------------------------------------------------
# Define the Reviewer Agent
# ---------------------------------------------------------
reviewer_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",
        retry_config=retry_config,
    ),
    name="content_reviewer",
    description="Analyzes educational content for technical accuracy and pedagogical quality.",
    instruction="""You are a Senior Professor of Electronics Engineering and a Stickler for Quality.
    
    You will receive a set of educational modules designed for students. Your job is to peer-review them.
    
    Analyze the content for:
    1. **Technical Accuracy:** Are the explanations physically correct? (e.g., confusing voltage with current, wrong formulas).
    2. **Depth:** Is it too superficial? Does it actually explain *why*, or just list facts?
    3. **Clarity:** Is the language precise and professional?
    4. **Safety:** Are there any dangerous instructions?
    
    Output your review in the following Markdown format:
    
    ## 🧐 Professor's Review
    
    **Overall Grade:** [A-F]
    
    ### ✅ Strengths
    * Point 1
    * Point 2
    
    ### ⚠️ Critiques & Improvements
    * **[Module Title]:** Specific criticism here. e.g., "The explanation of Ohm's Law is too simplified..."
    * **[General]:** Any other feedback.
    
    ### 🏁 Verification Status
    [PASS / NEEDS REVISION]
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
        # The agent output might be nested. We specifically want the 'modules' output.
        # However, the SequentialAgent returns a dictionary of all steps.
        # The key for the final step in main.py is "modules" (from individual_module_designer).
        
        # Let's handle different potential structures carefully
        modules_data = agent_response.get("modules")
        
        # If it's a string (JSON string), parse it
        if isinstance(modules_data, str):
             # Remove markdown code blocks if present
             clean_json = modules_data.replace("```json", "").replace("```", "").strip()
             data = json.loads(clean_json)
        else:
            data = modules_data

        # If data is wrapped in "modules" key again
        if isinstance(data, dict) and "modules" in data:
            module_list = data["modules"]
        elif isinstance(data, list):
            module_list = data
        else:
            return f"Error parsing modules: Unknown format {type(data)}"

        # Build Markdown
        md_output = "# 📚 Generated Learning Modules\n\n"
        
        for idx, mod in enumerate(module_list, 1):
            title = mod.get("title", "Untitled")
            content = mod.get("content", "No content provided.")
            resources = mod.get("resources", [])
            
            md_output += f"## {idx}. {title}\n\n"
            md_output += f"{content}\n\n"
            
            if resources:
                md_output += "**🔗 Recommended Resources:**\n"
                for res in resources:
                    if isinstance(res, dict):
                         # Handle object styled resources {name, url} if that's the case
                         name = res.get("name", "Link")
                         url = res.get("url", "#")
                         md_output += f"- [{name}]({url})\n"
                    else:
                         # Handle simple string URLs
                         md_output += f"- {res}\n"
            md_output += "\n---\n\n"
            
        return md_output

    except Exception as e:
        return f"Error formatting output: {str(e)}\nRaw Response: {agent_response}"


# ---------------------------------------------------------
# Main Execution
# ---------------------------------------------------------
async def run_review_pipeline():
    print("🚀 Starting Basic Agent Pipeline...")
    
    # 1. Run the original generation agent
    runner = InMemoryRunner(agent=root_agent)
    # run produces the final state dictionary
    # The SequentialAgent accumulates outputs in the state
    result_state = await runner.run_debug(DEFAULT_PROMPT)
    
    # 2. Format the output
    print("\n✅ Generation Complete. Formatting Output...\n")
    formatted_content = format_modules_output(result_state)
    
    print("="*60)
    print(formatted_content)
    print("="*60)
    
    # 3. Run the Reviewer
    print("\n🧐 Sending to Reviewer Agent...\n")
    
    reviewer_runner = InMemoryRunner(agent=reviewer_agent)
    # The runner's run method might be different or not exposed directly as run(input).
    # Using run_debug as seen in other files, which returns events.
    # We might need to extract text from events if run_debug returns an event stream.
    # However, let's try to see what run_debug returns in main.py: "response = await runner.run_debug(...)".
    # And then "print(response)".
    # In utils.py, run_agent does output_text = extract_text_from_events(events).
    
    # Let's use run_debug and print the raw response for now, or use the helper if we can import it.
    # Ideally we should use the run_agent helper from utils if possible, but let's stick to in-line for now.
    
    review_events = await reviewer_runner.run_debug(formatted_content)
    
    # If run_debug returns a list of events (which it seems to in utils.py), we need to handle it.
    # But main.py just prints it. Let's print it first to see.
    print("\n" + "="*60)
    print("REVIEW RESULTS:")
    print(review_events)
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_review_pipeline())
