from google.adk.agents import Agent, SequentialAgent, LlmAgent
from google.adk.tools import google_search

import sys
from pathlib import Path
import asyncio
from typing import List
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google.adk.models.google_llm import Gemini
from pathlib import Path

# Add backend root to PYTHONPATH
PROJECT_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PROJECT_ROOT))
from app.Beginner.utils import retry_config, run_agent



import asyncio
import logging

logger = logging.getLogger("ModulePipeline")

load_dotenv()

class LearningModule(BaseModel):
    concepts: str = Field(
        description="Detailed, curiosity-driven explanation that builds engineering intuition."
    )
    practical: str = Field(
        description="Hands-on experiment or investigation the student should perform."
    )
    resources: List[str] = Field(
        description="2–4 relevant URLs for deeper exploration."
    )


class LearningModulesOutput(BaseModel):
    modules: List[LearningModule]


curriculum_agent = LlmAgent(
    model = Gemini(
        model="gemini-2.5-flash-lite",
        retry_config=retry_config,
    ),
    name = "curriculum_designer",
    description = "Generates a comprehensive plan for how the modules will be and what topics will the modules be about.",
    instruction = f"""You are responsible for designing a concise learning roadmap for students in electronics and embedded systems.

Your job is to decide:
- What modules should exist
- What each module should focus on
- What topics and skills are covered
- What learning goals the student should achieve
- What external resources are useful

You must NOT generate detailed lesson content, explanations, or tutorials. Only define the structure and scope of the curriculum.

The curriculum should:
- Target beginner to early-intermediate engineering students.
- Avoid ultra-basic topics (e.g., “what is electricity”).
- Dont go deep in the concepts of embedded but more towards digital and analog electronics.
- Embedded related topics should only include very basic theoretical stuff.
- Balance electronics fundamentals with embedded system concepts.
- Be practical and project-oriented.

The roadmap must contain:
- Minimum 4 modules, maximum 5 modules.
- Each module should clearly state:
  - Learning goals (what the student should be able to do)
  - Key topics covered
  - Learning approach (hands-on, experimentation, debugging, etc.)
  - Assessment approach (how understanding can be checked)
  - Recommended resources (links or references)

Example topic areas (not mandatory):
- Analog and digital electronics
- Microcontroller fundamentals
- Embedded software basics
- Interfacing sensors and actuators
- Power and signal integrity

Focus on clarity, usefulness, and logical progression.
Keep the output simple, structured, and free of unnecessary wording.

The output should be in JSON format such a way that it will be helpful to be displayed on the frontend side using React.

using the output of search_tool include the urls given by that tool and include them in the output

Your output will include all of these things:
- Module titles
- Learning goals
- Key topics
- Learning approach
- Assessment approach

Dont have any urls or anything that is a link just the important curriculum thats all

    """,
    output_key = "curriculum_designer",
)


search_agent = LlmAgent(
    model = Gemini(
        model = "gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    name = "resource_gatherer",
    description = "Agent to retreive all the relevant urls and resources for a topic",
    instruction= """Using the google_search tool you are responsible to retreive all the releavant resources for the topics that will be given by the {curriculum_designer} and for each title u will find atleast 3 relevant and most useful links that can be youtube videos or articles or just plan theory but they must be really well so that the student will be able to understand that topic in more depth. The output should be actually something fruitfull and not just google searches so give them some actaul resource to follow""",
    tools=[google_search],
    output_key="resource_urls",

) 

# Main learning agent with enhanced discovery-based instruction
individual_module_designer = LlmAgent(
    model = Gemini(
        model="gemini-2.5-flash-lite",
        retry_config=retry_config,
    ),
    name="initial_modules_agent",
    description="Generates engaging, discovery-based electronics learning modules.",
    instruction="""You are a module designer responsible for converting a curriculum roadmap into deep, technically meaningful learning modules for electronics and embedded systems students.

You will receive structured input under the key {curriculum_designer}, which contains:
- Module titles
- Learning goals
- Key topics
- Learning approach
- Assessment approach


Your job is NOT to summarize this input.
Your job is to expand each module into a detailed technical explanation that builds real engineering understanding.

For each module:
- Explain the concepts thoroughly in plain engineering language.
- Go beyond surface definitions — explain how and why things behave the way they do in real circuits and boards.
- Include concrete examples (real components, signals, voltages, measurements, behaviors).
- Describe common failure cases or mistakes and what they teach.
- Show cause → effect reasoning instead of listing facts.
- Keep the explanation focused on helping a student confidently build and debug hardware.

Avoid:
- Generic textbook phrasing.
- High-level summaries that compress ideas.
- Marketing or motivational language.
- Repeating obvious definitions students already know.

Depth expectations:
- Each module’s content should feel like a short technical lesson, not a paragraph summary.
- A student should be able to read it and meaningfully reason about real circuits afterward.

Resources:
- Use the output of the  agent and select the best ones and add those in the output
- Select at most 3 credible and current URLs that genuinely help deepen understanding.

Output format (DO NOT CHANGE):
Each module must contain:
- "title": a clear module title (multiple subtopics in one title is acceptable)
- "content": a detailed technical explanation covering the full concept
- "resources": up to 3 relevant URLs

The output must:
- Be valid JSON only.
- Match the above structure exactly.
- Align one-to-one with the modules defined in the curriculum input.
- Contain no extra commentary or formatting.

You are implementing the curriculum — not redesigning it.
Focus on technical clarity, depth, and practical understanding.

You are implementing the curriculum — not redesigning it.
Focus on technical clarity, depth, and practical understanding.
Use **bolding** for key terms and component names within the JSON string content to make it readable.
Use bullet points and short paragraphs in the content description.

""",
    output_key="modules",
)


root_agent = SequentialAgent(
    name="module_designer",
    sub_agents=[curriculum_agent,search_agent,individual_module_designer]
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
        )

        # Print raw model output
        print(result)

    except Exception:
        logger.exception("❌ Module generation failed")


if __name__ == "__main__":
    asyncio.run(run_initial_modules_agent())
