from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from app.core.retriever import retrieve_content

qa_agent = Agent(
    model='gemini-2.5-flash',
    name='qa_agent',
    description='Troubleshooting and Q&A agent.',
    instruction='You are a helpful Q&A and troubleshooting assistant. You help users debug code and solve problems related to the project. You have access to the project context via the retrieval tool. Answer user queries clearly and provide solutions.',
    tools=[retrieve_content],
    output_key="answer"
)
qa_runner = InMemoryRunner(agent=qa_agent)
