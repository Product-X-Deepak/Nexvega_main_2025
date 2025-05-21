
import React from 'react';

export default function HelpPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Help Center</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">How do I upload my resume?</h3>
              <p className="text-muted-foreground">You can upload your resume by navigating to the candidates section and clicking on "Upload Resume".</p>
            </div>
            <div>
              <h3 className="font-medium">How do I apply for a job?</h3>
              <p className="text-muted-foreground">Browse the available jobs, click on a job you're interested in, and click the "Apply" button.</p>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Contact Support</h2>
          <p className="text-muted-foreground">If you need further assistance, please email us at support@example.com.</p>
        </div>
      </div>
    </div>
  );
}
