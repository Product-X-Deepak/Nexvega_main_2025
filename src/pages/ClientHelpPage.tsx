
import { useState } from 'react';
import ClientLayout from '@/components/layout/ClientLayout';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ClientHelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const faqs = [
    {
      question: "How do I view candidate profiles?",
      answer: "You can view candidates assigned to your company by navigating to the 'Candidates' page from the main menu. There, you'll see a list of candidates that have been pre-screened and matched to your requirements."
    },
    {
      question: "What does it mean to 'like' a candidate?",
      answer: "Liking a candidate indicates your interest in proceeding further with them. When you like a candidate, the recruitment team will be notified and will contact you to discuss next steps, such as scheduling an interview."
    },
    {
      question: "Can I download candidate resumes?",
      answer: "For confidentiality and data protection reasons, full candidate resumes are not available for direct download. However, all relevant skills, experience, and qualifications are presented in the candidate profiles. If you need specific additional information, please contact your account manager."
    },
    {
      question: "How do I provide feedback on candidates?",
      answer: "You can provide feedback on candidates by clicking the 'Provide Feedback' button on the candidate's profile page. Your feedback helps us better understand your preferences and improve our matching process."
    },
    {
      question: "How can I see the status of a candidate in the hiring pipeline?",
      answer: "Each candidate profile displays their current pipeline stage, such as 'Screening', 'Interview Scheduled', or 'Offer Sent'. This information is kept up-to-date to give you visibility into where each candidate stands in the process."
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the support team. We'll get back to you shortly."
      });
      setContactSubject('');
      setContactMessage('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <ClientLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">
            Find answers to your questions and get support
          </p>
        </div>

        <div className="max-w-xl mb-6">
          <Input 
            type="search"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <Tabs defaultValue="faqs" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faqs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions and answers about using the client portal
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredFaqs.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            {faq.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                    <Button variant="link" onClick={() => setSearchQuery('')}>
                      Clear search
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="guides" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Guides</CardTitle>
                <CardDescription>
                  Step-by-step guides to help you use the client portal effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium mb-2">Getting Started Guide</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Learn how to navigate the client portal and use its basic features.
                    </p>
                    <Button variant="outline" size="sm">View Guide</Button>
                  </div>
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium mb-2">Candidate Evaluation</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Learn how to review candidate profiles and provide effective feedback.
                    </p>
                    <Button variant="outline" size="sm">View Guide</Button>
                  </div>
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium mb-2">Working with Your Account Manager</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Understand how to communicate effectively with your recruitment team.
                    </p>
                    <Button variant="outline" size="sm">View Guide</Button>
                  </div>
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium mb-2">Job Posting Management</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Learn how to view and manage your job postings in the system.
                    </p>
                    <Button variant="outline" size="sm">View Guide</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Need help? Send us a message and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-sm font-medium">Subject</label>
                    <Input
                      id="subject"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="What can we help you with?"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium">Message</label>
                    <Textarea
                      id="message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Please describe your issue or question in detail"
                      rows={5}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-medium mb-4">Other Ways to Reach Us</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-1">Email Support</h4>
                      <p className="text-sm text-muted-foreground mb-2">For general inquiries and non-urgent issues</p>
                      <a href="mailto:clientsupport@nexvega.com" className="text-blue-600 hover:underline">
                        clientsupport@nexvega.com
                      </a>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-1">Phone Support</h4>
                      <p className="text-sm text-muted-foreground mb-2">Available Monday-Friday, 9AM-5PM EST</p>
                      <a href="tel:+1234567890" className="text-blue-600 hover:underline">
                        +1 (234) 567-890
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
