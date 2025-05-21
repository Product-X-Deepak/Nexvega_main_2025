
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Loader2, Plus, UserPlus, Heart, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types';

interface ClientAssignmentProps {
  candidateId: string;
  assignedClients?: string[];
  likedByClients?: string[];
  onUpdate: (clientIds: string[]) => void;
}

const ClientAssignment: React.FC<ClientAssignmentProps> = ({
  candidateId,
  assignedClients = [],
  likedByClients = [],
  onUpdate
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company_name');
        
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClient = async (clientId: string) => {
    if (assignedClients.includes(clientId)) return;
    
    try {
      const newAssignedClients = [...assignedClients, clientId];
      
      const { error } = await supabase
        .from('candidates')
        .update({ assigned_to_clients: newAssignedClients })
        .eq('id', candidateId);
        
      if (error) throw error;
      
      onUpdate(newAssignedClients);
      
      toast({
        title: 'Client assigned',
        description: 'The client has been assigned to this candidate',
      });
    } catch (error) {
      console.error('Error assigning client:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign client',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    try {
      const newAssignedClients = assignedClients.filter(id => id !== clientId);
      
      const { error } = await supabase
        .from('candidates')
        .update({ assigned_to_clients: newAssignedClients })
        .eq('id', candidateId);
        
      if (error) throw error;
      
      onUpdate(newAssignedClients);
      
      toast({
        title: 'Client removed',
        description: 'The client has been removed from this candidate',
      });
    } catch (error) {
      console.error('Error removing client:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove client',
        variant: 'destructive',
      });
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.company_name : 'Unknown Client';
  };

  return (
    <div className="space-y-3">
      {/* Assigned clients list */}
      {assignedClients.length > 0 ? (
        <div className="space-y-2">
          {assignedClients.map(clientId => {
            const isLiked = likedByClients?.includes(clientId);
            return (
              <div key={clientId} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  {getClientName(clientId)}
                  {isLiked && (
                    <Badge variant="outline" className="ml-2 text-rose-500 border-rose-200">
                      <Heart className="h-3 w-3 mr-1 fill-rose-500" />
                      Liked
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveClient(clientId)}
                  className="h-6 w-6 p-0 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No clients assigned yet</p>
      )}
      
      {/* Assign client button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Client
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>No clients found.</CommandEmpty>
              <CommandGroup>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  clients
                    .filter(client => !assignedClients.includes(client.id))
                    .map(client => (
                      <CommandItem
                        key={client.id}
                        onSelect={() => {
                          handleAssignClient(client.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className="mr-2 h-4 w-4 opacity-0"
                        />
                        {client.company_name}
                      </CommandItem>
                    ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ClientAssignment;
