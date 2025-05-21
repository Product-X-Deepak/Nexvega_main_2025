
import { Client } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const fetchClient = async (clientId: string): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
    
  if (error) throw error;
  
  return data as Client;
};

export const saveClient = async (
  clientData: Partial<Client>, 
  isEdit: boolean, 
  userId?: string
): Promise<{ data: any, error: any }> => {
  // Ensure required fields are present
  const requiredData = {
    company_name: clientData.company_name as string,
    contact_person: clientData.contact_person as string,
    email: clientData.email as string,
    phone: clientData.phone || null,
    address: clientData.address || null,
    industry: clientData.industry || null,
    status: clientData.status || 'active',
    ...(isEdit 
      ? { updated_at: new Date().toISOString() } 
      : { 
          created_by: userId, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        })
  };
  
  let response;
  
  if (isEdit) {
    response = await supabase
      .from('clients')
      .update(requiredData)
      .eq('id', clientData.id)
      .select();
  } else {
    response = await supabase
      .from('clients')
      .insert(requiredData)
      .select();
  }
  
  return response;
};
