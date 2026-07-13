import numpy as np
import json
import os
import hashlib
from openai import OpenAI
from app.config import settings

client = OpenAI(base_url=settings.ai_base_url, api_key=settings.gemini_api_key or "missing-key")

_kb_chunks = []
_kb_embeddings = None

_KB_PATH = os.path.join(os.path.dirname(__file__), "../../data/knowledge_base.json")
_CACHE_PATH = os.path.join(os.path.dirname(__file__), "../../data/embeddings_cache.npz")
_META_PATH = os.path.join(os.path.dirname(__file__), "../../data/embeddings_meta.json")


def _kb_hash() -> str:
    with open(_KB_PATH, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def _load_knowledge_base():
    global _kb_chunks, _kb_embeddings

    with open(_KB_PATH) as f:
        _kb_chunks = json.load(f)

    current_hash = _kb_hash()

    # use cached embeddings if KB and embedding model haven't changed
    if os.path.exists(_CACHE_PATH) and os.path.exists(_META_PATH):
        with open(_META_PATH) as f:
            meta = json.load(f)
        if (meta.get("hash") == current_hash and meta.get("count") == len(_kb_chunks)
                and meta.get("model") == settings.ai_embed_model):
            data = np.load(_CACHE_PATH)
            _kb_embeddings = data["embeddings"]
            print(f"[LifeForge AI] Loaded {len(_kb_chunks)} chunks from embedding cache.")
            return

    print(f"[LifeForge AI] Embedding {len(_kb_chunks)} KB chunks via {settings.ai_embed_model}...")
    texts = [c["text"] for c in _kb_chunks]

    # embed in batches of 32 to avoid payload limits
    all_embeddings = []
    batch_size = 32
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        resp = client.embeddings.create(model=settings.ai_embed_model, input=batch)
        all_embeddings.extend([e.embedding for e in resp.data])

    _kb_embeddings = np.array(all_embeddings)

    # persist to disk
    np.savez_compressed(_CACHE_PATH, embeddings=_kb_embeddings)
    with open(_META_PATH, "w") as f:
        json.dump({"hash": current_hash, "count": len(_kb_chunks), "model": settings.ai_embed_model}, f)

    print(f"[LifeForge AI] Embeddings cached ({_kb_embeddings.shape}).")


def embed_query(text: str) -> np.ndarray:
    resp = client.embeddings.create(model=settings.ai_embed_model, input=[text])
    return np.array(resp.data[0].embedding)


def retrieve_chunks(query: str, top_k: int = 20, disease_filter: str = None) -> list:
    global _kb_embeddings
    if _kb_embeddings is None:
        _load_knowledge_base()

    q_emb = embed_query(query)
    norms = np.linalg.norm(_kb_embeddings, axis=1) * np.linalg.norm(q_emb) + 1e-9
    scores = np.dot(_kb_embeddings, q_emb) / norms

    # disease-aware boost: +10% cosine score for chunks matching patient's disease
    if disease_filter:
        disease_filter_lower = disease_filter.lower().replace(" ", "_")
        for i, chunk in enumerate(_kb_chunks):
            chunk_disease = (chunk.get("disease") or "").lower()
            if chunk_disease == disease_filter_lower or disease_filter_lower in chunk_disease:
                scores[i] = min(1.0, scores[i] * 1.10)

    top_idx = np.argsort(scores)[-top_k:][::-1]
    return [
        {
            "text": _kb_chunks[i]["text"],
            "score": float(scores[i]),
            "disease": _kb_chunks[i].get("disease"),
            "topic": _kb_chunks[i].get("topic"),
            "nutrient": _kb_chunks[i].get("nutrient"),
            "source": _kb_chunks[i].get("source", "LifeForge"),
        }
        for i in top_idx
    ]


def rerank_chunks(query: str, chunks: list, top_k: int = 5) -> list:
    # chunks arrive sorted by disease-boosted cosine similarity;
    # keep the strongest ones (no dedicated rerank model on Gemini)
    return chunks[:top_k]


def get_ai_client():
    return client


def load_kb():
    _load_knowledge_base()
