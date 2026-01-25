from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv
import os

load_dotenv()   


EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "chatbot")
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
        return "\n\n".join([doc.page_content for doc in docs])
    except Exception as e:
        return f"Error during retrieval: {str(e)}"
