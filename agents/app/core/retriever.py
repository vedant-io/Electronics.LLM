import logging
import os
import pickle
import re
from functools import lru_cache
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("Retriever")

BASE_DIR = Path(__file__).resolve().parent
CONTENT_INDEX_DIR = BASE_DIR / "faiss_content"
CODE_INDEX_DIR = BASE_DIR / "faiss_code"
SOURCE_ROOT = BASE_DIR.parent


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _score_text(query_tokens: Sequence[str], text: str, title: str = "", section: str = "") -> float:
    haystack = f"{title}\n{section}\n{text}".lower()
    score = 0.0
    for token in query_tokens:
        if token in haystack:
            score += 1.0
            score += haystack.count(token) * 0.1
    if title:
        title_l = title.lower()
        for token in query_tokens:
            if token in title_l:
                score += 2.0
    if section:
        section_l = section.lower()
        for token in query_tokens:
            if token in section_l:
                score += 0.5
    return score


@lru_cache(maxsize=2)
def _load_faiss_documents(index_dir: str) -> List[Tuple[str, str, str, str]]:
    path = Path(index_dir)
    pkl_path = path / "index.pkl"
    if not pkl_path.exists():
        return []

    try:
        with pkl_path.open("rb") as handle:
            docstore, index_to_docstore_id = pickle.load(handle)
    except Exception as exc:
        logger.warning("Failed to load retriever index at %s: %s", pkl_path, exc)
        return []

    documents: List[Tuple[str, str, str, str]] = []
    for doc_id in index_to_docstore_id.values():
        document = docstore.search(doc_id)
        if not document:
            continue
        metadata = getattr(document, "metadata", {}) or {}
        documents.append(
            (
                metadata.get("title", ""),
                metadata.get("section", ""),
                metadata.get("url", ""),
                getattr(document, "page_content", ""),
            )
        )
    return documents


@lru_cache(maxsize=1)
def _load_source_snippets() -> List[Tuple[str, str, str, str]]:
    snippets: List[Tuple[str, str, str, str]] = []
    for root, _, files in os.walk(SOURCE_ROOT):
        for filename in files:
            if not filename.endswith(".py"):
                continue
            if filename.startswith("__"):
                continue
            file_path = Path(root) / filename
            try:
                content = file_path.read_text(encoding="utf-8")
            except Exception:
                continue
            rel_path = str(file_path.relative_to(SOURCE_ROOT))
            snippets.append((rel_path, "", "", content))
    return snippets


def _search_documents(
    query: str,
    documents: Iterable[Tuple[str, str, str, str]],
    limit: int = 5,
) -> List[Tuple[float, str, str, str, str]]:
    tokens = _tokenize(query)
    if not tokens:
        return []

    results: List[Tuple[float, str, str, str, str]] = []
    for title, section, url, content in documents:
        score = _score_text(tokens, content, title=title, section=section)
        if score <= 0:
            continue
        results.append((score, title, section, url, content))
    results.sort(key=lambda item: item[0], reverse=True)
    return results[:limit]


def _format_results(query: str, source_name: str, results: List[Tuple[float, str, str, str, str]]) -> str:
    if not results:
        return (
            "RETRIEVAL CONFIDENCE: NO MATCHES / ERROR\n"
            f"SOURCE: {source_name}\n"
            f"QUERY: {query}\n\n"
            "No relevant matches were found in the local knowledge base."
        )

    top_score = results[0][0]
    if top_score >= 8:
        confidence = "HIGH"
    elif top_score >= 4:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    lines = [
        f"RETRIEVAL CONFIDENCE: {confidence}",
        f"SOURCE: {source_name}",
        f"QUERY: {query}",
        "",
    ]

    for index, (score, title, section, url, content) in enumerate(results, start=1):
        excerpt = re.sub(r"\s+", " ", content).strip()
        excerpt = excerpt[:1200]
        lines.append(f"{index}. SCORE: {score:.2f}")
        if title:
            lines.append(f"   TITLE: {title}")
        if section:
            lines.append(f"   SECTION: {section}")
        if url:
            lines.append(f"   URL: {url}")
        lines.append(f"   EXCERPT: {excerpt}")
        lines.append("")

    return "\n".join(lines).rstrip()


def retrieve_content(query: str) -> str:
    """Search the content knowledge base and return a formatted summary."""
    try:
        documents = _load_faiss_documents(str(CONTENT_INDEX_DIR))
        results = _search_documents(query, documents, limit=5)
        return _format_results(query, "content-index", results)
    except Exception as exc:
        logger.exception("Content retrieval failed: %s", exc)
        return (
            "RETRIEVAL CONFIDENCE: NO MATCHES / ERROR\n"
            "SOURCE: content-index\n"
            f"QUERY: {query}\n\n"
            f"Retrieval error: {exc}"
        )


def _search_source_code(query: str, limit: int = 5) -> List[Tuple[float, str, str, str, str]]:
    tokens = _tokenize(query)
    if not tokens:
        return []

    candidates: List[Tuple[float, str, str, str, str]] = []
    for rel_path, _, _, content in _load_source_snippets():
        score = _score_text(tokens, content, title=rel_path)
        if score <= 0:
            continue
        candidates.append((score, rel_path, "", "", content))
    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[:limit]


def retrieve_code(query: str) -> str:
    """Search the code knowledge base and return reference snippets."""
    try:
        documents = _load_faiss_documents(str(CODE_INDEX_DIR))
        results = _search_documents(query, documents, limit=5)
        if results:
            return _format_results(query, "code-index", results)

        fallback_results = _search_source_code(query, limit=5)
        return _format_results(query, "source-code", fallback_results)
    except Exception as exc:
        logger.exception("Code retrieval failed: %s", exc)
        return (
            "RETRIEVAL CONFIDENCE: NO MATCHES / ERROR\n"
            "SOURCE: code-index\n"
            f"QUERY: {query}\n\n"
            f"Retrieval error: {exc}"
        )
