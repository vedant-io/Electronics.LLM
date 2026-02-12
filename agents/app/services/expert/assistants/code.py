from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from app.core.retriever import retrieve_code

code_agent = Agent(
    model='gemini-2.5-flash',
    name='code_agent',
    description='Extracts code for the project.',
    tools=[retrieve_code], # Uses the RAG agent as a tool
    instruction="""You are a smart code agent. Your goal is to extract the code for the given project from the database.
    1. Use the tool to find the code.
    2. IMPORTANT: Once you have the code from the tool, you MUST output it in your response using Markdown code blocks (e.g. ```cpp ... ``` or ```python ... ```).
    3. Do NOT just return the tool output. You must REPEAT the code in your final answer.
    4. Provide strictly the code, with minimal explanation like "Here is the code:".
    """
)
code_runner = InMemoryRunner(agent=code_agent)
