from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from app.core.retriever import retrieve_content

name_agent = Agent(
    model='gemini-2.5-flash',
    name='name_agent',
    description='Identifies the projects name based on user description.',
    instruction='You are an intelligent project classifier. You will be given a user description of a project they want to build. Your task is to use the retrieval tool to search the database for the most similar existing project. Analyze the retrieved content to find the specific name of the project. Return ONLY the name of the identified project. If no specific project is found, return "Unknown Project".',
    tools=[retrieve_content],
    output_key="project_name"
)
name_runner = InMemoryRunner(agent=name_agent)
