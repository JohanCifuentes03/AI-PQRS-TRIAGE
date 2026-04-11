CREATE INDEX IF NOT EXISTS "pqrs_embedding_idx" ON "pqrs"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
