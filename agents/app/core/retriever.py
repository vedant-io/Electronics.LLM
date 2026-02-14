import os
import logging
from typing import Dict, List
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

# ============================================================
# ENV
# ============================================================
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# ============================================================
# CONFIG
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DB_PATH = os.path.join(BASE_DIR, "faiss_content")
CODE_DB_PATH = os.path.join(BASE_DIR, "faiss_code")

# retrieval tuning
MAX_RESULTS = 12          # pull more context
FINAL_CONTEXT_LIMIT = 6   # send best to LLM

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("UniversalRetriever")

# ============================================================
# INIT
# ============================================================

embeddings = OpenAIEmbeddings(
    model=EMBED_MODEL,
    openai_api_key=OPENAI_API_KEY
)

print("Loading FAISS indexes...")

content_db = FAISS.load_local(
    CONTENT_DB_PATH,
    embeddings,
    allow_dangerous_deserialization=True
)

code_db = FAISS.load_local(
    CODE_DB_PATH,
    embeddings,
    allow_dangerous_deserialization=True
)

print("FAISS indexes loaded.\n")

# ============================================================
# CORE RETRIEVAL
# ============================================================

def _retrieve(
    db: FAISS,
    query: str,
    search_type: str
) -> Dict:
    """
    High-context retrieval optimized for RAG agents.
    """

    try:
        # pull MANY candidates first
        docs = db.similarity_search_with_score(query, k=MAX_RESULTS)

        if not docs:
            return {"status": "no_match", "query": query}

        # sort by best similarity
        docs = sorted(docs, key=lambda x: x[1])

        # take best N
        docs = docs[:FINAL_CONTEXT_LIMIT]

        matches = []
        context_blocks = []

        for i, (doc, score) in enumerate(docs):
            meta = doc.metadata or {}

            block = f"""
### RESULT {i+1}
Project: {meta.get("title","unknown")}
Section: {meta.get("section","")}
Source: {meta.get("url","")}

{doc.page_content}
"""
            context_blocks.append(block.strip())

            matches.append({
                "score": float(score),
                "content": doc.page_content,
                "metadata": meta
            })

        final_context = "\n\n".join(context_blocks)

        return {
            "status": "ok",
            "query": query,
            "type": search_type,
            "match_count": len(matches),
            "matches": matches,
            "context_string": final_context
        }

    except Exception as e:
        logger.exception("Retrieval error")
        return {
            "status": "error",
            "reason": str(e)
        }

# ============================================================
# PUBLIC API
# ============================================================

def retrieve_content(query: str) -> Dict:
    """
    For project explanation agent
    (theory, working, components, overview)
    """
    return _retrieve(content_db, query, "content")

def retrieve_code(query: str) -> Dict:
    """
    For code agent
    (arduino, sensors, libraries, sketches)
    """
    return _retrieve(code_db, query, "code")

# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":
    q = "gas leak detector arduino code"
    
    print("\n--- CODE SEARCH ---\n")
    res = retrieve_code(q)
    print(res["context_string"])

    print("\n--- CONTENT SEARCH ---\n")
    res = retrieve_content(q)
    print(res["context_string"])
