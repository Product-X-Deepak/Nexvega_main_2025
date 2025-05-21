
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Briefcase,
  Users,
  Edit,
  Trash,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ClientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (id) {
      fetchClient(id);
    }
  }, [id]);
  
  const fetchClient = async (clientId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      setClient(data as Client);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClient = () => {
    if (client) {
      navigate(`/clients/${client.id}/edit`);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  if (!client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Client Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The client profile you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/clients')}>Back to Clients</Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        {/* Page header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.company_name}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <Badge variant="outline" className={client.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}>
                {client.status}
              </Badge>
              <span>ID: {id?.substring(0, 8)}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClient}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/jobs`)}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  View Jobs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/candidates`)}>
                  <Users className="mr-2 h-4 w-4" />
                  View Candidates
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => null}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Main content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>
                    Details about {client.company_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Person</h3>
                      <p className="font-medium">{client.contact_person}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Industry</h3>
                      <p className="font-medium">{client.industry || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Contact Information</h3>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                        {client.email}
                      </a>
                    </div>
                    
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${client.phone}`} className="hover:underline">
                          {client.phone}
                        </a>
                      </div>
                    )}
                    
                    {client.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{client.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Created: {format(parseISO(client.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    {client.updated_at && client.updated_at !== client.created_at && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Updated: {format(parseISO(client.updated_at), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-md flex flex-col items-center justify-center">
                      <Users className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-2xl font-bold">
                        {client.assigned_candidates?.length || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">Assigned Candidates</span>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md flex flex-col items-center justify-center">
                      <Briefcase className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-2xl font-bold">
                        {/* This would need to be fetched from jobs table */}
                        0
                      </span>
                      <span className="text-sm text-muted-foreground">Active Jobs</span>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md flex flex-col items-center justify-center">
                      <Building className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-2xl font-bold">
                        {client.liked_candidates?.length || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">Liked Candidates</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="candidates">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Candidates</CardTitle>
                  <CardDescription>
                    Candidates that have been assigned to {client.company_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {client.assigned_candidates && client.assigned_candidates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Candidate cards would be mapped here */}
                      <p>Candidate list will be loaded here.</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                      <h3 className="text-lg font-medium">No Candidates Assigned</h3>
                      <p className="text-muted-foreground">
                        This client doesn't have any candidates assigned yet.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate('/candidates')}
                      >
                        Browse Candidates
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="jobs">
              <Card>
                <CardHeader>
                  <CardTitle>Client Jobs</CardTitle>
                  <CardDescription>
                    Jobs posted by {client.company_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <h3 className="text-lg font-medium">No Jobs Found</h3>
                    <p className="text-muted-foreground">
                      This client hasn't posted any jobs yet.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/jobs/new', { state: { clientId: client.id } })}
                    >
                      Create New Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
