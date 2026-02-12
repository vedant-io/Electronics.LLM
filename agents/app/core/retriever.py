import os
import logging
from typing import Dict, List, Optional
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger("UniversalRetriever")
logging.basicConfig(level=logging.INFO)

# -------------------------
# Configuration
# -------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# Index Names
INDEX_CONTENT = "electronicsllm-content"
INDEX_CODE = "electronicsllm-codeblocks"

# Retrieval Settings
SIMILARITY_THRESHOLD = 0.65  # Strictness for content
CODE_SIMILARITY_THRESHOLD = 0.70 # Stricter for code to avoid hallucinations
MAX_RESULTS = 5

# -------------------------
# Initialization
# -------------------------
embeddings = OpenAIEmbeddings(
    model=EMBED_MODEL,
    openai_api_key=OPENAI_API_KEY,
)

def _get_vector_store(index_name: str) -> Optional[PineconeVectorStore]:
    """
    Helper to initialize a PineconeVectorStore for a specific index.
    Returns None if connection fails.
    """
    try:
        store = PineconeVectorStore.from_existing_index(
            index_name=index_name,
            embedding=embeddings,
        )
        return store
    except Exception as e:
        logger.error(f"❌ Failed to connect to Pinecone index '{index_name}': {e}")
        return None

# Initialize stores lazily or globally?
# We'll initialize them globally but handle failures gracefully in functions.
# This prevents specific import errors if one index is missing but allows the app to start.

_content_store = _get_vector_store(INDEX_CONTENT)
_code_store = _get_vector_store(INDEX_CODE)


# -------------------------
# Core Retrieval Logic
# -------------------------

def _perform_retrieval(
    store: Optional[PineconeVectorStore],
    query: str,
    index_name: str,
    threshold: float,
    k: int
) -> Dict:
    """
    Generic retrieval function to handle logic for both content and code.
    """
    if store is None:
        # Try reconnecting if strictly necessary, or just fail
        return {
            "status": "error",
            "reason": f"Connection to index '{index_name}' is not established."
        }

    try:
        # Retrieve with scores
        # Note: LangChain's similarity_search_with_score usually returns distance or similarity depending on index metric.
        # Assuming cosine similarity where higher is better (0-1), or Euclidean where lower is better.
        # Standard Pinecone/Langchain usually normalizes this. 
        # We will assume usual behavior: score is similarity (0 to 1).
        
        raw_results = store.similarity_search_with_score(query, k=k)
        
        matches = []
        for doc, score in raw_results:
            # Filter by threshold
            # Check if score is Distance (lower=better) or Similarity (higher=better).
            # Usually Pinecone returns cosine similarity.
            # We'll assume higher is better for now based on previous code (score <= THRESHOLD suggests distance?)
            # Wait, previous code had `if score <= SIMILARITY_THRESHOLD`. 
            # If using Euclidean/DotProduct, lower might be better (distance).
            # If using Cosine, 1.0 is identical. 
            # Let's keep the logic consistent with previous `rag.py` which used `score <= SIMILARITY_THRESHOLD`.
            # This implies the index is likely using a Distance metric (Euclidean).
            
            if score <= threshold:
                matches.append({
                    "score": round(score, 3),
                    "content": doc.page_content,
                    "metadata": doc.metadata or {},
                    "source": doc.metadata.get("source", "unknown")
                })

        if not matches:
             return {
                "status": "no_match",
                "query": query,
                "message": f"No relevant results found in '{index_name}' matching the criteria."
            }

        # Format for Production Context
        # We return a structured prompt context string to help the LLM understand what it's looking at.
        formatted_context = "\n\n".join([
            f"--- Result {i+1} (Score: {m['score']}) ---\nSource: {m['source']}\nContent:\n{m['content']}"
            for i, m in enumerate(matches)
        ])
        print(formatted_context)

        return {
            "status": "ok",
            "query": query,
            "match_count": len(matches),
            "matches": matches,
            "context_string": formatted_context # Ready-to-inject context
        }

    except Exception as e:
        logger.exception(f"Error during retrieval from '{index_name}'")
        return {
            "status": "error",
            "reason": str(e)
        }


# -------------------------
# Public Interfaces
# -------------------------

def retrieve_content(query: str) -> Dict:
    """
    Retrieves project overview, module context, and general electronics knowledge.
    Target Index: eletronicsllm-content
    Use this for: Project descriptions, wiring guides, curriculum planning, theory.
    """
    return _perform_retrieval(
        store=_content_store,
        query=query,
        index_name=INDEX_CONTENT,
        threshold=SIMILARITY_THRESHOLD,
        k=MAX_RESULTS
    )

def retrieve_code(query: str) -> Dict:
    """
    Retrieves code snippets and implementation details.
    Target Index: electronicsllm-codeblocks
    Use this for: Generating Arduino sketches, C++ code, libraries.
    """
    return _perform_retrieval(
        store=_code_store,
        query=query,
        index_name=INDEX_CODE,
        threshold=CODE_SIMILARITY_THRESHOLD, # Slightly stricter for code
        k=MAX_RESULTS
    )
