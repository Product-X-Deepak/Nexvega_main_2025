
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams } from 'react-router-dom';

interface ClientFormPageProps {
  isEdit?: boolean;
}

export default function ClientFormPage({ isEdit = false }: ClientFormPageProps) {
  const { id } = useParams();
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? `Edit client details (ID: ${id})` : 'Create a new client profile'}
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
          <p>Client form will be displayed here.</p>
        </div>
      </div>
    </MainLayout>
  );
}
