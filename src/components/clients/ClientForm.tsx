
import React from 'react';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientFormProps {
  client: Partial<Client>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEdit: boolean;
  isSaving: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  client, 
  onChange, 
  onSubmit, 
  isEdit,
  isSaving 
}) => {
  const navigate = useNavigate();

  return (
    <Card>
      <form onSubmit={onSubmit}>
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
                value={client.company_name || ''}
                onChange={onChange}
                required
              />
            </div>
            
            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                value={client.industry || ''}
                onChange={onChange}
              />
            </div>
            
            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person <span className="text-destructive">*</span></Label>
              <Input
                id="contact_person"
                name="contact_person"
                value={client.contact_person || ''}
                onChange={onChange}
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
                value={client.email || ''}
                onChange={onChange}
                required
              />
            </div>
            
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={client.phone || ''}
                onChange={onChange}
              />
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={client.status || 'active'}
                onChange={onChange}
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
              value={client.address || ''}
              onChange={onChange}
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
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Client' : 'Create Client'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ClientForm;
