const Terms = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-serif font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using ZhenGrowth's services, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Services</h2>
            <p className="text-muted-foreground">
              ZhenGrowth provides professional coaching services, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>One-on-one coaching sessions</li>
              <li>Career development guidance</li>
              <li>Personal growth resources and materials</li>
              <li>Online assessments and quizzes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Booking and Cancellation</h2>
            <p className="text-muted-foreground">
              When you book a coaching session:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Payment is required at the time of booking</li>
              <li>You may reschedule up to 24 hours before the session at no charge</li>
              <li>Cancellations within 24 hours are non-refundable</li>
              <li>No-shows forfeit the full session fee</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Professional Relationship</h2>
            <p className="text-muted-foreground">
              The coaching relationship is professional in nature. Coaching is not therapy or psychological 
              counseling. If you require mental health support, we recommend consulting with a licensed 
              mental health professional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Confidentiality</h2>
            <p className="text-muted-foreground">
              We maintain strict confidentiality of all coaching sessions and client information, except 
              where disclosure is required by law or to prevent harm.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground">
              All materials, content, and resources provided through ZhenGrowth services are protected 
              by copyright and intellectual property laws. You may not reproduce, distribute, or sell 
              any materials without express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              ZhenGrowth and its coaching services are provided "as is" without warranties of any kind. 
              We are not liable for any decisions or actions you take based on coaching sessions or materials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of our services 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at hello@zhengrowth.com
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last updated: January 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
