from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from .tools import retrieve

# 1. Project Description Agent
desc_agent = Agent(
    model='gemini-2.5-flash',
    name='desc_agent',
    description='Provides project description and briefing.',
    instruction='You are an expert technical writer. You will be given a project topic. Your goal is to provide a comprehensive project description, introduction, and briefing. Use the retrieval tool to find specific details about the project from the database. Output should be clear text.',
    tools=[retrieve],
    output_key="description"
)
desc_runner = InMemoryRunner(agent=desc_agent)

# 2. Components & Wiring Agent
wiring_agent = Agent(
    model='gemini-2.5-flash',
    name='wiring_agent',
    description='Provides components, wiring, and building steps.',
    instruction='You are an expert engineer. You will be given a project topic. Your goal is to provide a detailed list of components, wiring instructions, and a step-by-step building process. Use the retrieval tool to find specific details. Output should be clear text.',
    tools=[retrieve],
    output_key="wiring_steps"
)
wiring_runner = InMemoryRunner(agent=wiring_agent)

# 3. Code Agent
code_agent = Agent(
    model='gemini-2.5-flash',
    name='code_agent',
    description='Extracts code for the project.',
    tools=[retrieve], # Uses the RAG agent as a tool
    instruction="""You are a smart code agent. Your goal is to extract the code for the given project from the database.
    1. Use the tool to find the code.
    2. IMPORTANT: Once you have the code from the tool, you MUST output it in your response using Markdown code blocks (e.g. ```cpp ... ``` or ```python ... ```).
    3. Do NOT just return the tool output. You must REPEAT the code in your final answer.
    4. Provide strictly the code, with minimal explanation like "Here is the code:".
    """
)
code_runner = InMemoryRunner(agent=code_agent)

# 4. Troubleshooting Agent
qa_agent = Agent(
    model='gemini-2.5-flash',
    name='qa_agent',
    description='Troubleshooting and Q&A agent.',
    instruction='You are a helpful Q&A and troubleshooting assistant. You help users debug code and solve problems related to the project. You have access to the project context via the retrieval tool. Answer user queries clearly and provide solutions.',
    tools=[retrieve],
    output_key="answer"
)
qa_runner = InMemoryRunner(agent=qa_agent)

# 5. Project Identification Agent
name_agent = Agent(
    model='gemini-2.5-flash',
    name='name_agent',
    description='Identifies the projects name based on user description.',
    instruction='You are an intelligent project classifier. You will be given a user description of a project they want to build. Your task is to use the retrieval tool to search the database for the most similar existing project. Analyze the retrieved content to find the specific name of the project. Return ONLY the name of the identified project. If no specific project is found, return "Unknown Project".',
    tools=[retrieve],
    output_key="project_name"
)
name_runner = InMemoryRunner(agent=name_agent)
