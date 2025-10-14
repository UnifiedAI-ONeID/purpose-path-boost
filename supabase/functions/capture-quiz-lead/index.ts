import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Resend types and client
interface ResendEmailRequest {
  from: string;
  to: string[];
  subject: string;
  html: string;
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

interface QuizLeadRequest {
  name: string;
  email: string;
  language: string;
  wechat?: string;
  clarityScore: number;
  answers: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, language, wechat, clarityScore, answers }: QuizLeadRequest = await req.json();

    console.log('Processing quiz lead:', { name, email, clarityScore });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Save lead to database
    const { error: dbError } = await supabase.from('leads').insert({
      name,
      email,
      language,
      wechat,
      clarity_score: clarityScore,
      quiz_answers: answers,
      source: 'quiz',
    });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save lead: ${dbError.message}`);
    }

    console.log('Lead saved successfully');

    // Initialize Resend for email sending
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }
    
    const resend = new Resend(resendApiKey);
    
    // Determine email content based on language
    const emailContent = getEmailContent(language, name, clarityScore);

    // Send confirmation email with 7-Day Clarity Sprint PDF
    const { error: emailError } = await resend.emails.send({
      from: 'ZhenGrowth <onboarding@resend.dev>', // Update with your verified domain
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      // Don't throw - lead is already saved, email failure shouldn't block
    } else {
      console.log('Email sent successfully to:', email);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Lead captured and email sent' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in capture-quiz-lead function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to generate email content based on language
function getEmailContent(language: string, name: string, score: number) {
  const siteUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://zhengrowth.com';
  const pdfUrl = `${siteUrl}/downloads/7-day-clarity-sprint.pdf`;

  if (language === 'zh-TW' || language === 'zh-CN') {
    return {
      subject: '您的 7 天清晰度冲刺指南',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0B3D3C; font-size: 28px; margin-bottom: 20px;">谢谢您，${name}！</h1>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            您的清晰度得分：<strong style="color: #E8B44D; font-size: 24px;">${score}%</strong>
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            基于您的评估，我为您准备了一份特别的指南，帮助您在接下来的 7 天内获得更多清晰度。
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" 
               style="display: inline-block; background-color: #D9462E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              下载您的免费指南
            </a>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            准备好进行下一步了吗？预约一次免费的发现会议，我们可以讨论您的具体目标和挑战。
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/book" 
               style="display: inline-block; background-color: #0B3D3C; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              预约免费会议
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            期待与您交流，<br>
            <strong>ZhenGrowth 团队</strong>
          </p>
        </div>
      `,
    };
  }

  // Default English email
  return {
    subject: 'Your 7-Day Clarity Sprint Guide',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0B3D3C; font-size: 28px; margin-bottom: 20px;">Thank you, ${name}!</h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Your clarity score: <strong style="color: #E8B44D; font-size: 24px;">${score}%</strong>
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Based on your assessment, I've prepared a special guide to help you gain more clarity over the next 7 days.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${pdfUrl}" 
             style="display: inline-block; background-color: #D9462E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Download Your Free Guide
          </a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Ready for the next step? Book a free discovery session and we can discuss your specific goals and challenges.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}/book" 
             style="display: inline-block; background-color: #0B3D3C; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Book Your Free Session
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          Looking forward to connecting,<br>
          <strong>The ZhenGrowth Team</strong>
        </p>
      </div>
    `,
  };
}
