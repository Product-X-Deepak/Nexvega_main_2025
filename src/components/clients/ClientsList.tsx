
import React from 'react';
import { Link } from 'react-router-dom';
import { Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui';
import { Building, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

interface ClientsListProps {
  clients: Client[];
  loading: boolean;
}

const ClientsList: React.FC<ClientsListProps> = ({ clients, loading }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Building className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No Clients Found</h3>
          <p className="text-muted-foreground max-w-md mt-1 mb-4">
            There are no clients that match your search criteria.
          </p>
          <Link to="/clients/new">
            <Button>Add New Client</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <Link to={`/clients/${client.id}`} key={client.id} className="block group">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {client.company_name}
                  </CardTitle>
                  <CardDescription>{client.contact_person}</CardDescription>
                </div>
                <Badge variant={client.status === 'active' ? 'default' : 'outline'}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.industry && (
                  <div className="text-muted-foreground flex items-center">
                    <Building className="h-3.5 w-3.5 mr-1.5" />
                    <span>{client.industry}</span>
                  </div>
                )}
                {client.created_at && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Added {format(parseISO(client.created_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default ClientsList;
