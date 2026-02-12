from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from app.services.expert.tools import retrieve

wiring_agent = Agent(
    model='gemini-2.5-flash',
    name='wiring_agent',
    description='Provides components, wiring, and building steps.',
    instruction='You are an expert engineer. You will be given a project topic. Your goal is to provide a detailed list of components, wiring instructions, and a step-by-step building process. Use the retrieval tool to find specific details. Output should be clear text.',
    tools=[retrieve],
    output_key="wiring_steps"
)
wiring_runner = InMemoryRunner(agent=wiring_agent)
