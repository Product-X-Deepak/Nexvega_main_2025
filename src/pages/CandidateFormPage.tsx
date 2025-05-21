
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams } from 'react-router-dom';

interface CandidateFormPageProps {
  isEdit?: boolean;
}

export default function CandidateFormPage({ isEdit = false }: CandidateFormPageProps) {
  const { id } = useParams();
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? 'Edit Candidate' : 'Add New Candidate'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? `Edit candidate details (ID: ${id})` : 'Create a new candidate profile'}
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
          <p>Candidate form will be displayed here.</p>
        </div>
      </div>
    </MainLayout>
  );
}
