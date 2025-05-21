import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Candidate, 
  CandidateNote, 
  Education, 
  WorkExperience, 
  PipelineStage,
  Project,
  Publication
} from '@/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Download,
  FileText,
  Link as LinkIcon,
  ExternalLink, 
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Book,
  ChevronDown,
  PenIcon,
  TrashIcon,
  MoreHorizontal,
  MessageCircle,
  Clock,
  Pencil,
  Building,
  Share,
  Heart,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import CandidateNotes from '@/components/candidates/CandidateNotes';
import PipelineStageSelector from '@/components/candidates/PipelineStageSelector';
import ClientAssignment from '@/components/candidates/ClientAssignment';
import { convertToCandidate, convertToCandidateNotes } from '@/utils/typeHelpers';

export default function CandidateProfilePage() {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchCandidate(id);
      fetchCandidateNotes(id);
    }
  }, [id]);
  
  const fetchCandidate = async (candidateId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (error) throw error;
      setCandidate(convertToCandidate(data));
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidate profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCandidateNotes = async (candidateId: string) => {
    setLoadingNotes(true);
    try {
      const { data, error } = await supabase
        .from('candidate_notes')
        .select(`
          id,
          candidate_id,
          content,
          type,
          created_at,
          updated_at,
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setNotes(convertToCandidateNotes(data));
    } catch (error) {
      console.error('Error fetching candidate notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };
  
  const handleUpdatePipelineStage = async (stage: PipelineStage) => {
    if (!candidate) return;
    
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ pipeline_stage: stage, updated_at: new Date().toISOString() })
        .eq('id', candidate.id);
        
      if (error) throw error;
      
      setCandidate({
        ...candidate,
        pipeline_stage: stage,
        updated_at: new Date().toISOString()
      });
      
      toast({
        title: 'Pipeline stage updated',
        description: `Candidate moved to ${stage.replace(/_/g, ' ')} stage`,
      });
    } catch (error) {
      console.error('Error updating candidate stage:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update pipeline stage',
        variant: 'destructive',
      });
    }
  };
  
  const handleDownloadResume = async () => {
    if (!candidate?.resume_url) {
      toast({
        title: 'Resume unavailable',
        description: 'No resume file is available for this candidate',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Open resume URL in a new tab
      window.open(candidate.resume_url, '_blank');
      
      toast({
        title: 'Resume downloaded',
        description: 'Resume file has opened in a new tab',
      });
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download resume file',
        variant: 'destructive',
      });
    }
  };
  
  const handleEditCandidate = () => {
    if (candidate?.id) {
      navigate(`/candidates/${candidate.id}/edit`);
    }
  };
  
  const handleAddNote = async (newNote: Omit<CandidateNote, 'id' | 'created_at' | 'updated_at' | 'profiles'>) => {
    if (!candidate?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('candidate_notes')
        .insert({
          candidate_id: candidate.id,
          content: newNote.content,
          type: newNote.type,
          user_id: newNote.user_id
        })
        .select(`
          id,
          candidate_id,
          content,
          type,
          created_at,
          updated_at,
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        `);
        
      if (error) throw error;
      
      // Convert the note to the correct type
      const convertedNotes = convertToCandidateNotes(data);
      
      setNotes(prev => [...convertedNotes, ...prev]);
      
      toast({
        title: 'Note added',
        description: 'The note has been added successfully',
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Failed to add note',
        description: 'The note could not be added',
        variant: 'destructive',
      });
    }
  };
  
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'CN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
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
            
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex space-x-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-24" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!candidate) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Candidate Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The candidate profile you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/candidates')}>Back to Candidates</Button>
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
            <h1 className="text-2xl font-bold tracking-tight">
              {candidate.full_name || 'Unnamed Candidate'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1">
              {candidate.pipeline_stage && (
                <Badge variant="outline" className="mr-2 capitalize">
                  {candidate.pipeline_stage.replace(/_/g, ' ')}
                </Badge>
              )}
              <span>ID: {id?.substring(0, 8)}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadResume}
              disabled={!candidate.resume_url}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Resume
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditCandidate}
              className="flex items-center gap-1"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab('notes')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Add Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => null}>
                  <Share className="mr-2 h-4 w-4" />
                  Share Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => null}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* Profile card */}
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarFallback className="text-xl">
                    {getInitials(candidate.full_name)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="mt-2">{candidate.full_name || 'Unnamed Candidate'}</CardTitle>
                {candidate.experience && candidate.experience.length > 0 && (
                  <CardDescription>
                    {candidate.experience[0].title}{candidate.experience[0].company ? ` at ${candidate.experience[0].company}` : ''}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact info */}
                <div className="space-y-3">
                  {candidate.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                        {candidate.email}
                      </a>
                    </div>
                  )}
                  
                  {candidate.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`tel:${candidate.phone}`} className="hover:underline">
                        {candidate.phone}
                      </a>
                    </div>
                  )}
                  
                  {candidate.linkedin_url && (
                    <div className="flex items-center text-sm">
                      <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={candidate.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline flex items-center"
                      >
                        LinkedIn
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Pipeline Stage */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Pipeline Stage</h4>
                  <PipelineStageSelector
                    currentStage={candidate.pipeline_stage}
                    onStageChange={handleUpdatePipelineStage}
                  />
                </div>
                
                <Separator />
                
                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Languages */}
                {candidate.languages && candidate.languages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.languages.map((language, i) => (
                        <Badge key={i} variant="outline">{language}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Client Assignment */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Client Assignment</h4>
                  <ClientAssignment 
                    candidateId={candidate.id} 
                    assignedClients={candidate.assigned_to_clients || []}
                    likedByClients={candidate.liked_by_clients || []}
                    onUpdate={(newAssignments) => {
                      setCandidate({
                        ...candidate,
                        assigned_to_clients: newAssignments
                      });
                    }}
                  />
                </div>
                
                {/* Created & Modified */}
                <div className="pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Created: {candidate.created_at && format(parseISO(candidate.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {candidate.updated_at && candidate.updated_at !== candidate.created_at && (
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Updated: {format(parseISO(candidate.updated_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="pt-6">
                <TabsContent value="profile" className="mt-0 space-y-6">
                  {/* Resume Summary */}
                  {candidate.resume_summary && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Summary</h3>
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {candidate.resume_summary}
                      </div>
                    </div>
                  )}
                  
                  {/* Education */}
                  {candidate.education && candidate.education.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2" />
                        Education
                      </h3>
                      <div className="space-y-4">
                        {candidate.education.map((edu: Education, index: number) => (
                          <div key={index} className="pl-2 border-l-2 border-muted">
                            <h4 className="font-medium">{edu.degree}</h4>
                            <p className="text-muted-foreground">{edu.institution}</p>
                            <p className="text-sm text-muted-foreground">
                              {edu.field_of_study}
                              {edu.start_date && (
                                <span> • {edu.start_date} - {edu.end_date || 'Present'}</span>
                              )}
                              {edu.grade && <span> • Grade: {edu.grade}</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Projects */}
                  {candidate.projects && candidate.projects.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Code className="h-5 w-5 mr-2" />
                        Projects
                      </h3>
                      <div className="space-y-4">
                        {candidate.projects.map((project: Project, index: number) => (
                          <div key={index} className="pl-2 border-l-2 border-muted">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{project.name}</h4>
                              {project.url && (
                                <a 
                                  href={project.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm flex items-center"
                                >
                                  View Project
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              )}
                            </div>
                            {project.description && (
                              <p className="text-muted-foreground">{project.description}</p>
                            )}
                            {project.technologies && project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.technologies.map((tech, techIndex) => (
                                  <Badge key={techIndex} variant="outline">{tech}</Badge>
                                ))}
                              </div>
                            )}
                            {project.start_date && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {project.start_date} - {project.end_date || 'Present'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Publications */}
                  {candidate.publications && candidate.publications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Book className="h-5 w-5 mr-2" />
                        Publications
                      </h3>
                      <div className="space-y-4">
                        {candidate.publications.map((pub: Publication, index: number) => (
                          <div key={index} className="pl-2 border-l-2 border-muted">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{pub.title}</h4>
                              {pub.url && (
                                <a 
                                  href={pub.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm flex items-center"
                                >
                                  View Publication
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              )}
                            </div>
                            {pub.publisher && (
                              <p className="text-muted-foreground">{pub.publisher}</p>
                            )}
                            {pub.description && (
                              <p className="text-sm text-muted-foreground">{pub.description}</p>
                            )}
                            {pub.date && (
                              <p className="text-sm text-muted-foreground mt-1">{pub.date}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="experience" className="mt-0 space-y-6">
                  {/* Work Experience */}
                  {candidate.experience && candidate.experience.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Work Experience
                      </h3>
                      <div className="space-y-6">
                        {candidate.experience.map((exp: WorkExperience, index: number) => (
                          <div key={index} className="pl-2 border-l-2 border-muted">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{exp.title}</h4>
                                <div className="flex items-center text-muted-foreground">
                                  <Building className="h-4 w-4 mr-1" />
                                  {exp.company}
                                </div>
                                {exp.location && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {exp.location}
                                  </div>
                                )}
                              </div>
                              {(exp.start_date || exp.end_date) && (
                                <div className="text-sm text-muted-foreground whitespace-nowrap">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {exp.start_date || 'Unknown'} - {exp.current ? 'Present' : exp.end_date || 'Unknown'}
                                </div>
                              )}
                            </div>
                            
                            {exp.responsibilities && exp.responsibilities.length > 0 && (
                              <div className="mt-2">
                                <h5 className="text-sm font-medium mb-1">Responsibilities:</h5>
                                <ul className="list-disc list-inside text-muted-foreground text-sm pl-1 space-y-1">
                                  {exp.responsibilities.map((resp, respIndex) => (
                                    <li key={respIndex}>{resp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                      <h3 className="text-lg font-medium">No Experience Information</h3>
                      <p className="text-muted-foreground">
                        This candidate doesn't have any work experience information.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="notes" className="mt-0 space-y-4">
                  <CandidateNotes 
                    notes={notes}
                    candidateId={candidate.id}
                    loading={loadingNotes}
                    onAddNote={handleAddNote}
                  />
                </TabsContent>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
