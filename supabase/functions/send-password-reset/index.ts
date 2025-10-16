import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { generatePasswordResetEmail, generatePasswordResetText } from './email-template.ts';

// Resend types and client
interface ResendEmailRequest {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

class Resend {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(data: ResendEmailRequest) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    return await response.json();
  }

  get emails() {
    return {
      send: (data: ResendEmailRequest) => this.sendEmail(data),
    };
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink, language = 'en' }: PasswordResetRequest = await req.json();

    console.log('Password reset email request for:', email);

    if (!email || !resetLink) {
      throw new Error('Email and reset link are required');
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    const resend = new Resend(resendApiKey);

    // Generate email HTML and text
    const html = generatePasswordResetEmail(email, resetLink, 24);
    const text = generatePasswordResetText(email, resetLink, 24);

    // Determine subject based on language
    const subjects: Record<string, string> = {
      'zh-CN': '重置您的 ZhenGrowth 密码',
      'zh-TW': '重置您的 ZhenGrowth 密碼',
      'en': 'Reset Your ZhenGrowth Password',
    };

    const subject = subjects[language] || subjects['en'];

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'ZhenGrowth <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: html,
      text: text,
    });

    console.log('Password reset email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully',
        id: emailResponse.id 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send password reset email' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);