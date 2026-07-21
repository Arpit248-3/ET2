"""
RAG Knowledge Retriever Node.
Retrieves top relevant knowledge chunks based on query intent and semantic keyword overlap.
Returns structured document objects with source, score, title, and text.
"""
from typing import Any, Dict, List, Optional
from app.ai.rag.knowledge_docs import KNOWLEDGE_DOCUMENTS
from app.ai.models.ai_models import KnowledgeChunk


class Retriever:
    """RAG Retriever that matches user query and intent against knowledge documents."""

    def __init__(self, documents: Optional[List[Dict[str, Any]]] = None):
        self.documents = documents or KNOWLEDGE_DOCUMENTS

    def retrieve(
        self,
        *,
        query: str,
        intent: str = "general",
        context: Optional[Dict[str, Any]] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Scoring function based on keyword matching, intent alignment, and title relevance.
        Returns top `limit` relevant document chunks.
        """
        q_tokens = set(query.lower().replace("?", "").replace(",", "").split())
        intent_tokens = set(intent.lower().replace("_", " ").split())

        scored_docs = []
        for doc in self.documents:
            doc_keywords = set(doc.get("keywords", []))
            doc_title = set(doc.get("title", "").lower().split())
            doc_text = set(doc.get("text", "").lower().split())

            # Keyword match score
            keyword_score = len(q_tokens.intersection(doc_keywords)) * 2.5
            title_score = len(q_tokens.intersection(doc_title)) * 1.5
            text_score = len(q_tokens.intersection(doc_text)) * 0.5
            intent_score = len(intent_tokens.intersection(doc_keywords)) * 1.0

            total_raw = keyword_score + title_score + text_score + intent_score
            # Normalize score between 0.65 and 0.98 for matching docs
            norm_score = round(min(0.65 + (total_raw * 0.05), 0.98), 2)

            if total_raw > 0:
                scored_docs.append({
                    "id": doc["id"],
                    "title": doc["title"],
                    "source": doc["source"],
                    "score": norm_score,
                    "content": doc.get("content", doc.get("text", "")),
                    "text": doc.get("text", doc.get("content", "")),
                    "category": doc.get("category", "POLICY"),
                })

        # Sort descending by score
        scored_docs.sort(key=lambda x: x["score"], reverse=True)

        # Fallback if no direct keyword match: return top general policy docs
        if not scored_docs:
            for doc in self.documents[:limit]:
                scored_docs.append({
                    "id": doc["id"],
                    "title": doc["title"],
                    "source": doc["source"],
                    "score": 0.70,
                    "content": doc.get("content", doc.get("text", "")),
                    "text": doc.get("text", doc.get("content", "")),
                    "category": doc.get("category", "POLICY"),
                })

        return scored_docs[:limit]
