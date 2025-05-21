import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Client } from '@/types';

export default function ClientDashboard() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (clientId) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientData) {
          // Convert the status to the correct type
          setClient({
            ...clientData,
            status: clientData.status === 'active' ? 'active' : 'inactive'
          } as Client);
        }
      }
    };

    fetchClientData();
  }, [clientId]);

  if (!client) {
    return (
      <MainLayout>
        <div>Loading client data...</div>
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
}
