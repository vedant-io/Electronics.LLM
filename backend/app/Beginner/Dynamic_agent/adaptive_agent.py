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

EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")



# Initialize Pinecone & Embeddings
# We use Langchain's Pinecone integration as seen in pure_ragpy.py
embeddings = OpenAIEmbeddings(
    model="text-embedding-ada-002",  # Matching pure_ragpy.py choice
    openai_api_key=OPENAI_API_KEY
)

# Initialize VectorStore
try:
    db = PineconeVectorStore.from_existing_index(
        index_name=PINECONE_INDEX_NAME, embedding=embeddings
    )
except Exception as e:
    print(f"Warning: Could not connect to Pinecone: {e}")
    db = None

# --- Tools ---

def retrieve(query: str):
    """
    Retrieve relevant documents from the vector store using Maximal Marginal Relevance (MMR).
    """
    if not db:
        return "Error: Database not connected."
    
    # MMR search
    try:
        docs = db.max_marginal_relevance_search(query, k=4, fetch_k=20)
        print(docs)
        return "\n\n".join([doc.page_content for doc in docs])
        
    except Exception as e:
        return f"Error during retrieval: {str(e)}"

curriculum_agent = Agent(
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
- using the retrieve tool get all the relevant components used for the project that the student has asked about and make the curriculum around the component and the board that is being used
- Include all the neccessary things the student will need to learn for that specific project
- Avoid anything that is not related to the project that is asked.
- Go decently deep in the board that will be used for that project
- All the modules must sequentiallly teach the student about the components, boards and other things used for the specific project. 
- Be practical and project-oriented.

The roadmap must contain:
- Minimum 4 modules, maximum 5 modules.
- Each module should clearly state:
  - Title: what is the thing that is being talked about
  - SubTitle: if there are multiple things in one title that can be taught we have to tell that aswell
  - Learning approach (hands-on, experimentation, debugging, etc.)
  - Assessment approach (how understanding can be checked)

Example topic areas (not mandatory):
- Based on the components used in the project 
- Used Board fundamentals

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
    instruction= """Using the google_search tool you are responsible to retreive all the releavant resources for the topics that will be given by the {curriculum_designer} and for each title u will find atleast 3 relevant and most useful links that can be youtube videos or articles or just plan theory but they must be really well so that the student will be able to understand that topic in more depth. The output should be actually something fruitfull and not just google searches so give them some actaul resource to follow""",
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
    instruction="""You are a senior embedded systems engineer and educator responsible for expanding a curriculum roadmap into deep, technically meaningful learning modules.

You will receive structured input under the key {curriculum_designer}. This input defines:
- Module titles
- Learning goals
- Key topics
- Learning approach
- Assessment approach
- Recommended resources

You must strictly follow this curriculum. Do not invent new modules or change scope.

Your task:
For each module, generate a detailed technical learning module that helps a student truly understand how the system behaves in real hardware.

The goal is not to summarize or simplify — the goal is to build engineering intuition.

Each module must:
- Explain what is happening electrically, logically, and at the system level.
- Describe how signals flow, how components interact, and what limits exist.
- Include concrete examples (real voltages, pins, signals, timings, measurements, behaviors).
- Include common failure modes, mistakes, and how engineers debug them.
- Show cause → effect reasoning instead of listing facts.
- Assume the reader is an engineering student (not a beginner hobbyist).

Avoid completely:
- Generic tutorials ("blink LED", "what is a resistor", etc.).
- Marketing tone, motivational language, or filler.
- Bullet-point summaries that compress ideas.
- Repeating obvious definitions students already know.

Depth expectation:
Each module’s content must read like a short technical lesson (several solid paragraphs), not a short summary. A student should be able to reason about real circuits and hardware behavior after reading it.

Resources:
- Using just the output of {resource_urls} you will provide the user the urls to respective topic
- You will not create anything new or just plain rubbish and just use the ones that the {resource_urls} agent will give simple.

OUTPUT FORMAT (STRICT — DO NOT CHANGE):

The output must be valid JSON only.  
Do not use markdown, headings, bullet symbols, or commentary.

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
- "content" must be detailed and technically rich.
- Maximum 5 modules, minimum 4 modules.
- Output must contain only JSON and nothing else.

You are implementing the curriculum — not redesigning it.
Focus on correctness, depth, and real-world engineering understanding.
When generating resources:
- You MUST call the google_search tool to retrieve real links.
- Do NOT invent URLs from memory.
- Select only URLs that appear in the search results.
- Prefer official documentation, reputable electronics sites, or manufacturer pages.
- Avoid blogs with low technical depth or outdated content.

Each module’s "content" should be at least 300–450 words.
If the explanation is shorter, expand it with deeper reasoning, concrete examples, and failure analysis.

Do not write like a blog article or tutorial guide.
Write like an engineer explaining a system to another engineer.
Use **bolding** for key terms and component names within the JSON string content.
Use bullet points and short paragraphs in the content for readability.

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
