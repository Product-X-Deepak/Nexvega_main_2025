
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserNotificationSettings {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  newCandidateAlerts: boolean;
  weeklyDigest: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: string;
  reducedMotion: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings>({
    emailNotifications: true,
    desktopNotifications: false,
    newCandidateAlerts: true,
    weeklyDigest: true,
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'system',
    fontSize: 'medium',
    reducedMotion: false,
  });
  
  // Function to handle notification settings changes
  const handleNotificationChange = (key: keyof UserNotificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Function to handle appearance settings changes
  const handleAppearanceChange = (key: keyof AppearanceSettings, value: string | boolean) => {
    setAppearanceSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Function to save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // In a real app, we'd save to the database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email notifications about important updates</p>
              </div>
              <Switch
                id="email-notifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="desktop-notifications" className="font-medium">Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">Show desktop notifications when browser is open</p>
              </div>
              <Switch
                id="desktop-notifications"
                checked={notificationSettings.desktopNotifications}
                onCheckedChange={(checked) => handleNotificationChange('desktopNotifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="candidate-alerts" className="font-medium">New Candidate Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when new candidate matches your jobs</p>
              </div>
              <Switch
                id="candidate-alerts"
                checked={notificationSettings.newCandidateAlerts}
                onCheckedChange={(checked) => handleNotificationChange('newCandidateAlerts', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-digest" className="font-medium">Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">Receive a weekly summary of activities</p>
              </div>
              <Switch
                id="weekly-digest"
                checked={notificationSettings.weeklyDigest}
                onCheckedChange={(checked) => handleNotificationChange('weeklyDigest', checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={appearanceSettings.theme}
                onValueChange={(value) => handleAppearanceChange('theme', value as 'light' | 'dark' | 'system')}
              >
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Select
                value={appearanceSettings.fontSize}
                onValueChange={(value) => handleAppearanceChange('fontSize', value)}
              >
                <SelectTrigger id="font-size">
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reduced-motion" className="font-medium">Reduced Motion</Label>
                <p className="text-sm text-muted-foreground">Minimize animations for accessibility</p>
              </div>
              <Switch
                id="reduced-motion"
                checked={appearanceSettings.reducedMotion}
                onCheckedChange={(checked) => handleAppearanceChange('reducedMotion', checked)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
