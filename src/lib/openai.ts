import OpenAI from 'openai';

// This will be stored as an environment variable in deployment
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

if (!apiKey) {
  console.error('Missing OpenAI API key. Please check your configuration.');
}

export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // For client-side use - in production, this should be server-side only
});

// In a production environment, API requests should be made through edge functions
// to protect API keys

// Model types as string literals instead of enum to avoid type issues
export const ModelType = {
  GPT35Turbo: 'gpt-3.5-turbo',
  GPT4o: 'gpt-4o',
  TextEmbedding: import.meta.env.VITE_OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
} as const;

export type ModelTypeKey = keyof typeof ModelType;

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: ModelType.TextEmbedding,
    input: text,
  });

  return response.data[0].embedding;
}

// Parse resume text with GPT
export async function parseResume(resumeText: string, modelType: string = ModelType.GPT4o) {
  const systemPrompt = `
    You are an expert ATS (Applicant Tracking System) resume parser.
    Extract the following information in a structured JSON format:
    - full_name: The candidate's full name
    - email: The candidate's email address
    - phone: The candidate's phone number
    - linkedin_url: The candidate's LinkedIn profile URL if available
    - other_links: Array of other relevant URLs (GitHub, portfolio, etc.)
    - social_media: Object with social media handles (key is platform, value is handle/URL)
    - resume_summary: A concise summary of the candidate's profile
    - objective: The candidate's career objective if stated
    - skills: Array of technical and soft skills
    - languages: Array of languages known
    - education: Array of education details with institution, degree, field_of_study, start_date, end_date, grade
    - experience: Array of work experiences with company, title, location, start_date, end_date, current (boolean), responsibilities (array)
    - projects: Array of projects with name, description, technologies, url, start_date, end_date
    - publications: Array of publications with title, publisher, date, url, description

    Return only the JSON object without any explanations.
    Leave fields empty or null if the information is not available in the resume.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: modelType,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: resumeText }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : null;
  } catch (error) {
    console.error('Error in parseResume:', error);
    throw new Error(`Failed to parse resume: ${error.message || 'Unknown error'}`);
  }
}

// Match job description with candidate profiles
export async function matchJobWithCandidates(jobDescription: string, candidateProfiles: any[], modelType: string = ModelType.GPT4o) {
  const systemPrompt = `
    You are an expert talent matcher for an ATS (Applicant Tracking System).
    Analyze the job description and candidate profiles to rank the candidates based on their fit for the role.
    Consider skills, experience, education, and overall alignment with the job requirements.
    
    For each candidate, provide:
    1. A match score from 0-100
    2. Key strengths related to the job
    3. Potential gaps or areas for improvement
    4. Brief rationale for the ranking
    
    Return a structured JSON array of candidates ranked from best to worst match.
  `;

  const userContent = `
    Job Description:
    ${jobDescription}
    
    Candidate Profiles:
    ${JSON.stringify(candidateProfiles, null, 2)}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: modelType,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : null;
  } catch (error) {
    console.error('Error in matchJobWithCandidates:', error);
    throw new Error(`Failed to match job with candidates: ${error.message || 'Unknown error'}`);
  }
}

// Process resume with selected model
export const processResume = async (resumeText: string, modelType: string = ModelType.GPT4o) => {
  try {
    const parsedData = await parseResume(resumeText, modelType);
    return parsedData;
  } catch (error) {
    console.error('Error processing resume:', error);
    throw new Error('Failed to process resume');
  }
};
