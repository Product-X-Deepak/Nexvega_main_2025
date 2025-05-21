
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import ClientForm from '@/components/clients/ClientForm';
import { fetchClient, saveClient } from '@/utils/clientHelpers';

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<Partial<Client>>({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    status: 'active'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (isEdit && id) {
      loadClientData(id);
    }
  }, [isEdit, id]);
  
  const loadClientData = async (clientId: string) => {
    try {
      setLoading(true);
      const data = await fetchClient(clientId);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client details',
        variant: 'destructive',
      });
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      if (!formData.company_name || !formData.contact_person || !formData.email) {
        toast({
          title: 'Validation Error',
          description: 'Please fill out all required fields.',
          variant: 'destructive',
        });
        return;
      }
      
      const { data, error } = await saveClient(formData, isEdit, user?.id);
      
      if (error) throw error;
      
      toast({
        title: `Client ${isEdit ? 'Updated' : 'Created'}`,
        description: `Successfully ${isEdit ? 'updated' : 'created'} ${formData.company_name}`,
      });
      
      navigate('/clients');
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} client:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} client. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Loading client data...</span>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? `Edit client details` : 'Create a new client profile'}
          </p>
        </div>
        
        <ClientForm 
          client={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isEdit={isEdit}
          isSaving={saving}
        />
      </div>
    </MainLayout>
  );
}
