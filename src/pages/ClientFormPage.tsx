
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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
      fetchClient(id);
    }
  }, [isEdit, id]);
  
  const fetchClient = async (clientId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
        
      if (error) throw error;
      
      setFormData(data as Client);
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
      
      // Ensure required fields are present
      const clientData = {
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        industry: formData.industry || null,
        status: formData.status || 'active',
        ...(isEdit ? { updated_at: new Date().toISOString() } : { 
          created_by: user?.id, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        })
      };
      
      let response;
      
      if (isEdit && id) {
        response = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', id)
          .select();
      } else {
        response = await supabase
          .from('clients')
          .insert(clientData)
          .select();
      }
      
      const { data, error } = response;
      
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
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry || ''}
                    onChange={handleChange}
                  />
                </div>
                
                {/* Contact Person */}
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person <span className="text-destructive">*</span></Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                  />
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/clients')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Client' : 'Create Client'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
