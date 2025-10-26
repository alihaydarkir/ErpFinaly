-- Enable pgvector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Create rag_knowledge table with vector embeddings
CREATE TABLE IF NOT EXISTS rag_knowledge (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768), -- Adjust based on model
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search
CREATE INDEX idx_rag_knowledge_embedding ON rag_knowledge 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

