
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Client } from '@/types';

const ClientDashboard: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      if (clientId) {
        try {
          const { data: clientData, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

          if (error) {
            console.error('Error fetching client data:', error);
            return;
          }

          if (clientData) {
            // Convert the status to the correct type
            setClient({
              ...clientData,
              status: clientData.status === 'active' ? 'active' : 'inactive'
            } as Client);
          }
        } catch (err) {
          console.error('Failed to fetch client data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClientData();
  }, [clientId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold">Client not found</h2>
          <p className="text-muted-foreground mt-2">The requested client data could not be found.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{client.company_name}</CardTitle>
            <CardDescription>
              Contact: {client.contact_person} ({client.email})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium leading-none">Status</p>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Industry</p>
                <p className="text-sm text-muted-foreground">{client.industry || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Phone</p>
                <p className="text-sm text-muted-foreground">{client.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Address</p>
                <p className="text-sm text-muted-foreground">{client.address || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ClientDashboard;
