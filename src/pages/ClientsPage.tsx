
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus } from 'lucide-react';
import ClientsList from '@/components/clients/ClientsList';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('company_name');

      if (error) {
        throw error;
      }

      setClients(data as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.industry && client.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeClients = filteredClients.filter(client => client.status === 'active');
  const inactiveClients = filteredClients.filter(client => client.status === 'inactive');

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">
              View and manage all clients
            </p>
          </div>
          
          <div className="flex gap-2 self-end sm:self-auto">
            <Link to="/clients/new">
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> 
                Add Client
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="active">Active ({activeClients.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveClients.length})</TabsTrigger>
            <TabsTrigger value="all">All ({filteredClients.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <ClientsList clients={activeClients} loading={loading} />
          </TabsContent>
          
          <TabsContent value="inactive">
            <ClientsList clients={inactiveClients} loading={loading} />
          </TabsContent>
          
          <TabsContent value="all">
            <ClientsList clients={filteredClients} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
