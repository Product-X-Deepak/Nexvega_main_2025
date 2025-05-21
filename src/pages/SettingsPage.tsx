
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StaffProfile } from '@/components/StaffProfile';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newCandidateAlerts: true,
    jobUpdates: true,
    weeklyDigest: false,
    systemAnnouncements: true
  });

  const [appearance, setAppearance] = useState({
    theme: "system",
    compactMode: false
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingSettings(true);
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .eq('created_by', user.id);
          
        if (error) throw error;
        
        // Process settings if they exist
        if (data && data.length > 0) {
          data.forEach(setting => {
            if (setting.key === 'notifications') {
              setNotificationSettings({
                ...notificationSettings,
                ...setting.value
              });
            } else if (setting.key === 'appearance') {
              setAppearance({
                ...appearance,
                ...setting.value
              });
            }
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          title: "Error loading settings",
          description: "Your settings could not be loaded. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoadingSettings(false);
      }
    };
    
    loadSettings();
  }, [user?.id]);

  const saveSettings = async (key: string, value: any) => {
    if (!user?.id) return;
    
    try {
      setSaveLoading(true);
      
      // Check if setting already exists
      const { data: existingData, error: queryError } = await supabase
        .from('settings')
        .select('id')
        .eq('created_by', user.id)
        .eq('key', key)
        .maybeSingle();
        
      if (queryError) throw queryError;
      
      let result;
      
      if (existingData) {
        // Update existing setting
        result = await supabase
          .from('settings')
          .update({ value })
          .eq('id', existingData.id);
      } else {
        // Insert new setting
        result = await supabase
          .from('settings')
          .insert({
            key,
            value,
            created_by: user.id,
            description: `User setting for ${key}`
          });
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully."
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: "Your settings could not be saved. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    const updatedSettings = {
      ...notificationSettings,
      [key]: value
    };
    setNotificationSettings(updatedSettings);
    saveSettings('notifications', updatedSettings);
  };

  const handleAppearanceChange = (key: string, value: any) => {
    const updatedSettings = {
      ...appearance,
      [key]: value
    };
    setAppearance(updatedSettings);
    saveSettings('appearance', updatedSettings);
  };

  return (
    <MainLayout>
      <div className="container max-w-5xl py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Tabs 
          defaultValue="profile" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            {user && <StaffProfile userId={user.id} isCurrentUser={true} />}
            
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
                <Button variant="outline">Change Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control which notifications you receive from the ATS system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications} 
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    disabled={loadingSettings || saveLoading}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Candidate Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new candidates are added to the system
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.newCandidateAlerts}
                    onCheckedChange={(checked) => handleNotificationChange('newCandidateAlerts', checked)}
                    disabled={loadingSettings || saveLoading || !notificationSettings.emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Job Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about job status changes and new jobs
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.jobUpdates}
                    onCheckedChange={(checked) => handleNotificationChange('jobUpdates', checked)}
                    disabled={loadingSettings || saveLoading || !notificationSettings.emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of system activity
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.weeklyDigest}
                    onCheckedChange={(checked) => handleNotificationChange('weeklyDigest', checked)}
                    disabled={loadingSettings || saveLoading || !notificationSettings.emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Announcements</p>
                    <p className="text-sm text-muted-foreground">
                      Receive important announcements about the ATS system
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.systemAnnouncements}
                    onCheckedChange={(checked) => handleNotificationChange('systemAnnouncements', checked)}
                    disabled={loadingSettings || saveLoading || !notificationSettings.emailNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the ATS system looks for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme Preference</Label>
                    <select
                      id="theme"
                      className="w-full border rounded-md p-2"
                      value={appearance.theme}
                      onChange={(e) => handleAppearanceChange('theme', e.target.value)}
                      disabled={loadingSettings || saveLoading}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred color theme for the application
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Use a more compact layout with less spacing
                      </p>
                    </div>
                    <Switch 
                      checked={appearance.compactMode}
                      onCheckedChange={(checked) => handleAppearanceChange('compactMode', checked)}
                      disabled={loadingSettings || saveLoading}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Apply Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
