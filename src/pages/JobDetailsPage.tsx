
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams } from 'react-router-dom';

export default function JobDetailsPage() {
  const { id } = useParams();
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Details</h1>
          <p className="text-muted-foreground">
            View job details (ID: {id})
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
          <p>Job details will be displayed here.</p>
        </div>
      </div>
    </MainLayout>
  );
}
