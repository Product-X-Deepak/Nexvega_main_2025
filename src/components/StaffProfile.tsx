
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StaffProfileProps {
  userId: string;
  isCurrentUser?: boolean;
  onUpdate?: () => void;
}

interface StaffData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  position?: string;
  created_at: string;
  last_sign_in?: string;
}

export function StaffProfile({ userId, isCurrentUser = false, onUpdate }: StaffProfileProps) {
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    position: "",
  });
  const { toast } = useToast();

  const fetchStaffData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setStaffData(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        position: data.position || "",
      });
    } catch (error) {
      console.error("Error fetching staff profile:", error);
      toast({
        title: "Error",
        description: "Could not load staff profile data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          position: formData.position,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });

      setIsEditOpen(false);
      fetchStaffData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Staff Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex animate-pulse">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="ml-4 space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!staffData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Staff profile not found.</p>
        </CardContent>
      </Card>
    );
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Staff Profile</span>
          {isCurrentUser && (
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile information below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="position" className="text-right">
                      Position
                    </Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateProfile}>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" alt={staffData.full_name} />
            <AvatarFallback>{getInitials(staffData.full_name)}</AvatarFallback>
          </Avatar>

          <div className="ml-4">
            <h3 className="font-medium">{staffData.full_name}</h3>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <span>{staffData.email}</span>
              <Badge variant="outline">{staffData.role}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {staffData.position && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Position</span>
              <span>{staffData.position}</span>
            </div>
          )}
          
          {staffData.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phone</span>
              <span>{staffData.phone}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last sign in</span>
            <span>{formatDate(staffData.last_sign_in)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account created</span>
            <span>{formatDate(staffData.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
