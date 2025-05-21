
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams } from 'react-router-dom';

interface JobFormPageProps {
  isEdit?: boolean;
}

export default function JobFormPage({ isEdit = false }: JobFormPageProps) {
  const { id } = useParams();
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? 'Edit Job' : 'Add New Job'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? `Edit job details (ID: ${id})` : 'Create a new job listing'}
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
          <p>Job form will be displayed here.</p>
        </div>
      </div>
    </MainLayout>
  );
}
