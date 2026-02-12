from google.adk.agents import SequentialAgent
import asyncio
import logging
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend root to PYTHONPATH
PROJECT_ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(PROJECT_ROOT))

# Local imports from sibling files
from .curriculum import curriculum_agent
from .search import search_agent
from .modules import individual_module_designer
from app.core.utils import run_agent

logger = logging.getLogger("ModulePipeline")

load_dotenv()

root_agent = SequentialAgent(
    name="module_designer",
    sub_agents=[curriculum_agent, search_agent, individual_module_designer]
)

# -------------------------
# Main Execution
# -------------------------

DEFAULT_PROMPT = """
Create me 4 modules that will have detailes information on any basic topic that will brush up the basics of electronics and embedded systems for an engineering student. And keep the info very detailed and comprehensive.
"""

async def run_initial_modules_agent():
    try:
        result = await run_agent(
            agent=root_agent,
            prompt=DEFAULT_PROMPT,
            target_agent="initial_modules_agent",
        )

        # Print raw model output
        print(result)

    except Exception:
        logger.exception("❌ Module generation failed")


if __name__ == "__main__":
    asyncio.run(run_initial_modules_agent())
