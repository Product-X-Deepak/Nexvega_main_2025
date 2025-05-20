
# ATS System - Applicant Tracking System

## Overview

A full-featured Applicant Tracking System (ATS) designed for recruiters, hiring managers, and clients. This system streamlines the recruitment process by providing tools for resume parsing, candidate management, client interaction, and job posting.

## Features

- **Role-Based Access Control**: Different permissions for Admins, Staff, and Clients
- **Resume Parsing**: Automatic extraction of candidate information from various file formats (PDF, DOC, DOCX, CSV, Excel)
- **AI-Powered Matching**: Find the best candidates for each job using embeddings and similarity search
- **Candidate Pipeline Management**: Track candidates through each stage of the hiring process
- **Client Portal**: Secure access for clients to view assigned candidates without revealing sensitive information
- **ChatGPT Integration**: AI assistants for both admin and staff with different permission levels
- **Bulk Operations**: Import, export, and manage candidate data in bulk
- **Analytics Dashboard**: Track recruitment metrics and visualize data

## Tech Stack

- **Frontend**: React with TypeScript
- **UI Framework**: TailwindCSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL) with pgvector for embedding-based search
- **Authentication**: Supabase Auth
- **File Processing**: pdf-parse, mammoth, csv-parser, xlsx
- **AI Integration**: OpenAI API for text embeddings and resume parsing
- **Hosting**: Vercel + Supabase

## User Roles

### Admin
- Complete system access including user management
- Can create, edit, delete and manage all entities
- Access to all reports and analytics
- Can configure system settings
- Can manage permissions and roles

### Staff
- Create and manage candidates
- Upload and process resumes
- Create and manage job postings
- Move candidates through hiring pipelines
- Add notes and feedback to candidates

### Client
- View candidates assigned to them (with limited information)
- Like or reject candidates
- Provide feedback on candidates
- View their active job postings
- Track candidate pipeline progress

## Setup and Installation

1. Clone this repository
2. Set up Supabase project and configure tables
3. Configure environment variables
4. Install dependencies: `npm install`
5. Run the development server: `npm run dev`

## Environment Variables

The following environment variables are required:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
```

## Database Structure

The Supabase database includes the following tables:

- **users**: User accounts with role information
- **candidates**: Candidate profiles with all extracted resume data
- **clients**: Client company information
- **jobs**: Job postings and requirements
- **candidate_notes**: Notes and feedback for candidates
- **rejection_reasons**: Reasons provided by clients for rejecting candidates

## Deployment

This project is configured for deployment on Vercel with Supabase as the backend.

## License

Proprietary software. All rights reserved.
