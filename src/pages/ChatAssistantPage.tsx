import MainLayout from '@/components/layout/MainLayout';
import ChatAssistant from '@/components/ChatAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, BrainCircuit } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChatAssistantPage() {
  const { isAdmin } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>(import.meta.env.VITE_OPENAI_DEFAULT_MODEL || "gpt-3.5-turbo");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {isAdmin() ? 'Admin Assistant with full system access' : 'Staff Assistant with limited access'}
            </p>
          </div>
          
          <div className="w-64">
            <Select 
              value={selectedModel} 
              onValueChange={setSelectedModel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>AI Models</SelectLabel>
                  <SelectItem value="gpt-3.5-turbo">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>GPT-3.5 Turbo (Fast)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gpt-4o">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-purple-500" />
                      <span>GPT-4o (Advanced)</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Currently using: {selectedModel === "gpt-3.5-turbo" ? "GPT-3.5 Turbo (Faster)" : "GPT-4o (More powerful)"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ChatAssistant model={selectedModel} />
          </div>
          
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assistant Information</CardTitle>
                <CardDescription>Model capabilities and access levels</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="models">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="models">Models</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="models" className="space-y-4 pt-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium">GPT-3.5 Turbo</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Faster responses, ideal for simpler queries and day-to-day tasks. Uses fewer tokens and is more cost-effective.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-purple-500" />
                        <h3 className="font-medium">GPT-4o</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        More advanced capabilities, better at complex tasks, reasoning, and detailed responses. Best for complex resume parsing and matching.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="permissions" className="pt-3">
                    <div className="space-y-4">
                      {isAdmin() ? (
                        <>
                          <div className="text-sm">
                            <span className="font-medium">Admin Assistant</span> has access to:
                          </div>
                          <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
                            <li>All candidate and client data</li>
                            <li>Job posting management</li>
                            <li>User and permission management</li>
                            <li>System settings and configurations</li>
                            <li>Analytics and reports</li>
                            <li>Bulk upload and management operations</li>
                          </ul>
                        </>
                      ) : (
                        <>
                          <div className="text-sm">
                            <span className="font-medium">Staff Assistant</span> has access to:
                          </div>
                          <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
                            <li>Candidate management</li>
                            <li>Resume processing</li>
                            <li>Job posting creation and editing</li>
                            <li>Pipeline management</li>
                            <li>Basic reporting</li>
                          </ul>
                          <div className="text-sm mt-4 text-amber-600 dark:text-amber-500">
                            Does not have access to system settings, user management, or sensitive analytics
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
                <CardDescription>Get the most out of the assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-3 list-disc pl-5 text-muted-foreground">
                  <li>Be specific with your questions to get better answers</li>
                  <li>Use GPT-3.5 Turbo for faster responses on simple queries</li>
                  <li>Switch to GPT-4o for complex tasks requiring more reasoning</li>
                  <li>The assistant can help with candidate matching, resume analysis, and job descriptions</li>
                  <li>For bulk operations, clearly specify the number of items you want to process</li>
                  <li>Ask for help on using any feature of the ATS system</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
