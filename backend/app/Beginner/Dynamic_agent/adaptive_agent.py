from google.adk.agents import Agent, SequentialAgent
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool
import sys
from pathlib import Path
from google.adk.models.google_llm import Gemini
from google.genai import types
PROJECT_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PROJECT_ROOT))
import asyncio
import logging
from google.adk.runners import InMemoryRunner
from app.config import GENERATION_CONFIG, JSON_GENERATION_CONFIG
from app.Beginner.utils import retry_config, run_agent


from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv
import os

logger = logging.getLogger("ModulePipeline")

load_dotenv()

# -------------------------
# Config
# -------------------------

EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Similarity gating threshold
# Lower = stricter matching (distance metric)
SIMILARITY_THRESHOLD = 0.65
MAX_RESULTS = 4


# -------------------------
# Initialize Embeddings
# -------------------------

embeddings = OpenAIEmbeddings(
    model=EMBED_MODEL,
    openai_api_key=OPENAI_API_KEY,
)

# -------------------------
# Connect to Existing Index
# -------------------------

try:
    vector_db = PineconeVectorStore.from_existing_index(
        index_name=PINECONE_INDEX_NAME,
        embedding=embeddings,
    )
except Exception as e:
    print(f"⚠️ Pinecone connection failed: {e}")
    vector_db = None


# -------------------------
# Retrieval Tool
# -------------------------

def retrieve(query: str) -> dict:
    """
    Retrieve semantically relevant documents from Pinecone with
    similarity filtering and clean formatting for LLM usage.
    """

    if vector_db is None:
        return {
            "status": "error",
            "reason": "Vector database not connected."
        }

    try:
        # Retrieve with scores (distance metric)
        raw_results = vector_db.similarity_search_with_score(
            query,
            k=MAX_RESULTS,
        )

        filtered_results = []

        for doc, score in raw_results:
            # LangChain Pinecone returns distance (lower = better)
            if score <= SIMILARITY_THRESHOLD:
                filtered_results.append({
                    "score": round(score, 3),
                    "content": doc.page_content,
                    "metadata": doc.metadata or {},
                })

        if not filtered_results:
            return {
                "status": "no_match",
                "query": query,
                "message": "No sufficiently relevant documents found in the knowledge base."
            }
        
        print(filtered_results)
        print(query)

        return {
            "status": "ok",
            "query": query,
            "matches": filtered_results
        }

    except Exception as e:
        return {
            "status": "error",
            "query": query,
            "reason": str(e)
        }
    
curriculum_agent = Agent(
    model = Gemini(
        model="gemini-2.5-flash-lite",
        retry_config=retry_config,
    ),
    name = "curriculum_designer",
    description = "Generates a comprehensive plan for how the modules will be and what topics will the modules be about.",
    instruction = f"""You are responsible for designing a concise, technically grounded learning roadmap for students building a specific electronics or embedded systems project.

You have access to a retrieve tool that returns semantically relevant technical chunks from a verified knowledge base. Each retrieval result may represent only a partial fragment of a larger document. Treat retrieved content as evidence, not assumptions.

Your workflow:
1. Use the retrieve tool to identify the actual board, components, interfaces, and system behaviors relevant to the project described by the user.
2. Extract only what can be confidently supported by the retrieved content.
3. If retrieval does not provide sufficient evidence for a component or concept, do NOT invent or assume it.
4. Build the curriculum strictly around the confirmed hardware, interfaces, and system behavior.

Your job is to define:
- What modules should exist
- What each module should focus on
- What technical topics and skills are required
- What learning goals the student should achieve
- How the learning should be structured and assessed

You must NOT generate lesson content, explanations, or tutorials. Only define the structure and scope of the curriculum.

Curriculum constraints:
- The curriculum must be fully aligned with the actual project hardware and system identified via retrieval.
- Avoid unrelated electronics topics, generic foundations, or filler material.
- Go reasonably deep into the board architecture, interfaces, and constraints relevant to the project.
- Modules must build sequentially from hardware understanding → interfacing → system integration → validation.
- The roadmap must prepare the student to realistically build, debug, and reason about the target project.

The roadmap must contain:
- Minimum 4 modules, maximum 5 modules.
- Each module must include:
  - Title: the primary technical focus of the module
  - SubTitle: secondary concepts if multiple systems are involved
  - Learning goals: concrete technical capabilities the student should gain
  - Key topics: specific technical subjects and interfaces
  - Learning approach: how the student should engage (hands-on, measurement, debugging, experimentation)
  - Assessment approach: how understanding can be validated

Output rules:
- Output must be valid JSON only.
- Structure must be frontend-friendly for React rendering.
- Do not include URLs, citations, or links.
- Do not include explanations, commentary, or formatting outside JSON.
- Do not redesign the project — only structure the learning path around it.

If retrieve returns insufficient or low-confidence matches:
- Clearly narrow the curriculum scope to what is confidently supported.
- Avoid speculative components or features.

Focus on technical correctness, logical progression, and real-world applicability.
    """,
    tools=[retrieve],
    output_key = "curriculum_designer",
)

search_agent = Agent(
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
    tools=[google_search],
    output_key="resource_urls",
)   

adaptive_modules_agent = Agent(
    model = Gemini(
        model="gemini-2.5-flash-lite",
        retry_config=retry_config,
    ),
    name="adaptive_modules_agent",
    description="Dynamically generates project-aligned, debugging-focused learning modules.",
    instruction="""You are a senior embedded systems engineer and educator responsible for expanding a curriculum roadmap into deep, technically grounded learning modules.

You will receive structured input under the key {curriculum_designer}. This input defines:
- Module titles
- Learning goals
- Key topics
- Learning approach
- Assessment approach

You must strictly follow this curriculum. Do not invent new modules, change scope, or introduce components not present in the curriculum.

You will also receive structured resource data under the key {resource_urls}. These resources are retrieved from a verified search process and may represent partial or fragmented technical sources. Treat them as authoritative inputs. Do not fabricate or substitute links.

Your task:
For each module, generate a detailed technical learning module that helps a student understand how the system behaves in real hardware and software.

The objective is not simplification or summarization — the objective is to build engineering intuition and causal understanding.

Each module must:
- Explain what happens electrically, logically, and at the system level.
- Describe signal flow, timing relationships, data paths, and hardware constraints.
- Show how components interact under normal operation and under failure conditions.
- Include concrete technical examples (voltages, pin roles, sampling behavior, timing limits, signal integrity effects, peripheral behavior).
- Explain common failure modes, misconfigurations, measurement errors, and debugging strategies.
- Use cause → effect reasoning rather than descriptive listing.
- Assume the reader is an engineering student with basic foundational knowledge.

Avoid completely:
- Generic tutorials or beginner walkthroughs ("blink LED", wiring basics, trivial definitions).
- Motivational, marketing, or explanatory fluff.
- High-level summaries that compress important technical detail.
- Restating obvious textbook definitions without practical context.
- Introducing hardware or interfaces not present in the curriculum input.

Depth expectations:
- Each module’s content must read like a short technical lesson composed of multiple coherent paragraphs.
- A student should be able to reason about real circuit behavior, firmware behavior, and system limits after reading it.
- Superficial explanations are unacceptable.

Resources:
- Use only the URLs provided in {resource_urls}.
- Do not invent, modify, or replace URLs.
- Select the most relevant URLs for each module based on technical alignment.
- Do not include links not present in {resource_urls}.

OUTPUT FORMAT (STRICT — DO NOT CHANGE):

The output must be valid JSON only.  
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
- Maximum 5 modules, minimum 4 modules.
- Output must contain only JSON and nothing else.
- Modules must align one-to-one with the curriculum structure.
- Do not reorder modules unless explicitly required by the curriculum.

Formatting inside JSON strings:
- Use short paragraphs for readability.
- Use bullet points sparingly only when listing concrete technical constraints or parameters.
- Use bold formatting only for key technical terms, signals, registers, interfaces, and components.
- Avoid stylistic or decorative formatting.

You are implementing the curriculum — not redesigning it.
Focus on technical correctness, causal clarity, and real-world engineering behavior.
Write as an engineer explaining a system to another engineer.

""",
    output_key="adaptive_modules",
    tools=[retrieve],
)


root_agent = SequentialAgent(
    name="project_based_modules",
    sub_agents=[curriculum_agent,search_agent,adaptive_modules_agent]
)


DEFAULT_PROMPT = """
How to make a Smart Dustbin using Arduino
"""


async def run_initial_modules_agent():
    try:
        runner = InMemoryRunner(agent=root_agent)
        response = await runner.run_debug(
           DEFAULT_PROMPT
        )

        # Print raw model output
        print(response)

    except Exception:
        logger.exception("❌ Module generation failed")


if __name__ == "__main__":
    asyncio.run(run_initial_modules_agent())
