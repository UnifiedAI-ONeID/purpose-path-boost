const Privacy = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-serif font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground">
              At ZhenGrowth, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Name and email address when you sign up for our services</li>
              <li>Contact information such as WeChat ID (optional)</li>
              <li>Quiz responses and assessment results</li>
              <li>Communication preferences and language settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our coaching services</li>
              <li>Send you the resources you request, such as our 7-Day Clarity Sprint guide</li>
              <li>Communicate with you about our services, offers, and events</li>
              <li>Personalize your experience and provide relevant content</li>
              <li>Analyze usage patterns to improve our website and services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Analytics</h2>
            <p className="text-muted-foreground">
              We use analytics tools (Umami and PostHog) to understand how visitors interact with our 
              website. These tools collect anonymous usage data to help us improve your experience. 
              You can opt out of analytics tracking through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at 
              hello@zhengrowth.com
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

export default Privacy;
