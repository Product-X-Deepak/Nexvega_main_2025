
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

export default function JobsPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            View and manage all job listings
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
          <p>Jobs list will be displayed here.</p>
        </div>
      </div>
    </MainLayout>
  );
}
