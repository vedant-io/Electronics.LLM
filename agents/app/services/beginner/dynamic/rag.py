from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv
import os

load_dotenv()

# -------------------------
# Config
# -------------------------

EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "quickstart-py")
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
