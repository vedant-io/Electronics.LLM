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
    instruction= """You are a resource extraction agent.

Your only responsibility is to collect high-quality technical reference URLs for each module defined in {curriculum_designer} using the google_search tool.

Workflow:
1. For each module title and its key topics from {curriculum_designer}, perform targeted google_search queries.
2. Identify authoritative, technically reliable sources relevant to the exact topic.
3. Prefer the following sources when available:
   - Official documentation sites (Arduino, Raspberry Pi, Espressif, ARM, Microchip, ST, TI)
   - Reputable electronics education platforms (SparkFun, Adafruit, AllAboutCircuits, DigiKey TechForum)
   - Manufacturer datasheets and application notes
   - University or engineering course material
4. Avoid:
   - Low-quality blogs
   - SEO spam sites
   - Forum-only answers without technical depth
   - Outdated tutorials
   - Aggregator or repost sites
   - Links that require login or payment

Output requirements (STRICT):
- Return ONLY valid JSON.
- Do NOT include explanations, descriptions, commentary, markdown, or extra text.
- Do NOT include duplicate URLs.
- Do NOT invent URLs — only use links that appear directly in google_search results.
- Each module must have at least 3 URLs and at most 5 URLs.

Output format (DO NOT CHANGE):

{
  "resource_urls": [
    {
      "module_title": "string",
      "urls": [
        "https://example.com/...",
        "https://example.com/..."
      ]
    }
  ]
}

Rules:
- The module_title must exactly match the module titles in {curriculum_designer}.
- URLs must directly correspond to the technical scope of the module.
- If fewer than 3 high-quality links exist for a module, return only what is confidently relevant.
- Do not fabricate or approximate URLs.
- Output must contain only JSON and nothing else.
""",
    tools=[],
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


You will also receive structured resource data under the key {resource_urls}. These resources are retrieved from a verified search process and may represent partial or fragmented technical sources. Treat them as authoritative inputs. Do not fabricate or substitute links.

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
- Use only the URLs provided in {resource_urls}.
- Do not invent, modify, or replace URLs.
- Select the most relevant URLs for each module based on technical alignment.
- Do not include links not present in {resource_urls}.

Output format (STRICT — DO NOT CHANGE):

The output must be valid JSON only.
Do NOT generate Python code or scripts.
Do NOT use code blocks like ```python ... ```.
Do not include markdown, headings, commentary, or surrounding text.

The structure must be exactly:

{
  "modules": [
    {
      "title": "string",
      "subtitle": "string",
      "content": "string",
      "resources": [
        { "name": "string", "url": "string" }
      ]
    }
  ]
}

Rules:
- Every module must include all four fields exactly as shown.
- Output must contain only JSON and nothing else.
- Modules must align one-to-one with the curriculum structure.
- Do not reorder modules unless explicitly required by the curriculum.

Formatting inside JSON strings:
- Use short paragraphs for readability.
- Use bullet points sparingly only when listing concrete technical constraints or parameters.
- Use bold formatting only for key technical terms, signals, registers, interfaces, and components.
- Avoid stylistic or decorative formatting.

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
            target_agent="initial_modules_agent",
        )

        # Print raw model output
        print(result)

    except Exception:
        logger.exception("❌ Module generation failed")


if __name__ == "__main__":
    asyncio.run(run_initial_modules_agent())
