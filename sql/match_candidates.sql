
-- This function needs to be executed in the Supabase SQL editor

-- Create function for matching candidates by embedding similarity
CREATE OR REPLACE FUNCTION match_candidates_by_embedding(
  query_embedding vector,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  linkedin_url text,
  other_links text[],
  social_media jsonb,
  resume_summary text,
  objective text,
  skills text[],
  languages text[],
  education jsonb,
  experience jsonb,
  projects jsonb,
  publications jsonb,
  resume_id text,
  resume_url text,
  created_at timestamptz,
  updated_at timestamptz,
  status text,
  pipeline_stage text,
  assigned_to_clients text[],
  liked_by_clients text[],
  created_by uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.full_name,
    c.email,
    c.phone,
    c.linkedin_url,
    c.other_links,
    c.social_media,
    c.resume_summary,
    c.objective,
    c.skills,
    c.languages,
    c.education,
    c.experience,
    c.projects,
    c.publications,
    c.resume_id,
    c.resume_url,
    c.created_at,
    c.updated_at,
    c.status,
    c.pipeline_stage,
    c.assigned_to_clients,
    c.liked_by_clients,
    c.created_by,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM
    candidates c
  WHERE
    c.embedding IS NOT NULL
    AND c.status = 'active'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY
    c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
