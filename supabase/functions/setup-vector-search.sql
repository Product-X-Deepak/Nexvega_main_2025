
-- Create function to match candidates to jobs using vector similarity
CREATE OR REPLACE FUNCTION match_candidates_to_job(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  full_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    candidates.id,
    candidates.full_name,
    1 - (candidates.embedding <=> query_embedding) AS similarity
  FROM candidates
  WHERE 
    candidates.status = 'active' 
    AND candidates.embedding IS NOT NULL
    AND 1 - (candidates.embedding <=> query_embedding) > match_threshold
  ORDER BY candidates.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to match jobs to candidates using vector similarity
CREATE OR REPLACE FUNCTION match_jobs_to_candidate(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jobs.id,
    jobs.title,
    1 - (jobs.embedding <=> query_embedding) AS similarity
  FROM jobs
  WHERE 
    jobs.status = 'published' 
    AND jobs.embedding IS NOT NULL
    AND 1 - (jobs.embedding <=> query_embedding) > match_threshold
  ORDER BY jobs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
