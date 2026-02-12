from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from app.services.expert.tools import retrieve

desc_agent = Agent(
    model='gemini-2.5-flash',
    name='desc_agent',
    description='Provides project description and briefing.',
    instruction='You are an expert technical writer. You will be given a project topic. Your goal is to provide a comprehensive project description, introduction, and briefing. Use the retrieval tool to find specific details about the project from the database. Output should be clear text.',
    tools=[retrieve],
    output_key="description"
)
desc_runner = InMemoryRunner(agent=desc_agent)
