import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { generatePasswordResetEmail, generatePasswordResetText } from './email-template.ts';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

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


interface PasswordResetRequest {
  email: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, language = 'en' }: PasswordResetRequest = await req.json();

    console.log('Password reset email request for:', email);

    if (!email) {
      return jsonResponse({ 
        success: false, 
        error: 'Email is required' 
      }, 200);
    }

    // Initialize Supabase Admin client to generate proper recovery link
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return jsonResponse({ 
        success: false, 
        error: 'Service not configured properly' 
      }, 200);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate password recovery link using Supabase Admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError);
      return jsonResponse({ 
        success: false, 
        error: 'Failed to generate recovery link. Please try again.' 
      }, 200);
    }

    if (!linkData?.properties?.action_link) {
      return jsonResponse({ 
        success: false, 
        error: 'Unable to generate recovery link. Please contact support.' 
      }, 200);
    }

    const resetLink = linkData.properties.action_link;
    console.log('Generated recovery link for:', email);

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return jsonResponse({ 
        success: false, 
        error: 'Email service not configured. Please contact support.' 
      }, 200);
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

    return jsonResponse({ 
      success: true, 
      message: 'Password reset email sent successfully',
      id: emailResponse.id 
    }, 200);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    
    // Check if it's a Resend domain verification error
    const errorMessage = error.message || 'Failed to send password reset email';
    const isResendDomainError = errorMessage.includes('verify a domain') || errorMessage.includes('testing emails');
    
    // CRITICAL: Return 200 status with error in body for proper client handling
    // Using 503 or other error codes causes Supabase client to throw before parsing response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: isResendDomainError 
          ? 'Email service configuration required. Please verify your domain in Resend to send password reset emails.'
          : 'Unable to send password reset email. Please try again or contact support.',
        needsDomainVerification: isResendDomainError
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

serve(handler);