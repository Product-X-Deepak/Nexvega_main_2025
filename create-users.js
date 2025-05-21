import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin account can only be created with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createOrUpdateUser(email, password, role, fullName) {
  try {
    // 1. Try to create the user or reset the password for existing user
    let userId;
    
    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase.auth.admin.listUsers();
    
    const userExists = existingUser?.users.find(user => user.email === email);
    
    if (userExists) {
      console.log(`User ${email} already exists, updating password...`);
      
      // Update the user's password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        userExists.id,
        { password: password }
      );
      
      if (updateError) {
        console.error(`Error updating password for ${email}:`, updateError);
        return false;
      }
      
      userId = userExists.id;
      console.log(`Password updated for ${email} with ID: ${userId}`);
    } else {
      // Create a new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto-confirm the email
      });

      if (authError) {
        console.error(`Error creating auth user ${email}:`, authError);
        return false;
      }
      
      userId = authData.user.id;
      console.log(`Auth user created: ${email} with ID: ${userId}`);
    }
    
    // 2. Update or create profile entry for the user
    // First check if profile already exists
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!profileFetchError && existingProfile) {
      // Update the existing profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          email: email,
          full_name: fullName || email.split('@')[0],
          role: role,
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        console.error(`Error updating profile for ${email}:`, profileError);
        return false;
      }

      console.log(`Profile updated for ${email} with role: ${role}`);
    } else {
      // Create a new profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName || email.split('@')[0],
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        console.error(`Error creating profile for ${email}:`, profileError);
        return false;
      }

      console.log(`Profile created for ${email} with role: ${role}`);
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

async function createOrUpdateUsers() {
  console.log('Creating/updating users in Supabase...');

  // Create admin user
  await createOrUpdateUser('admin@nexvega.com', 'Nexvega123$$', 'admin', 'Admin User');
  
  // Create staff user
  await createOrUpdateUser('staff@nexvega.com', 'Nexvega@123', 'staff', 'Staff User');
  
  // Create client user
  await createOrUpdateUser('jp.morgan@nexvega.com', 'Morgan@123', 'client', 'JP Morgan');

  console.log('User creation/update completed.');
}

createOrUpdateUsers()
  .catch(console.error)
  .finally(() => process.exit()); 