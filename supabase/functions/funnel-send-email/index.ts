import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  profileId?: string;
  templateId?: string;
  toEmail?: string;
  subject?: string;
  htmlBody?: string;
  queueId?: string;
  variables?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { fetch } }
    );

    const { profileId, templateId, toEmail, subject, htmlBody, queueId, variables }: EmailRequest = await req.json();
    
    let finalToEmail = toEmail;
    let finalSubject = subject || '';
    let finalHtmlBody = htmlBody || '';
    let finalFromName = 'ZhenGrowth';
    let finalFromEmail = 'hello@zhengrowth.com';
    let attachments: any[] = [];

    // If template ID provided, load template
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*, email_attachments(*)')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      finalSubject = template.subject;
      finalHtmlBody = template.html_body;
      finalFromName = template.from_name;
      finalFromEmail = template.from_email;

      // Get profile data for variable substitution
      if (profileId) {
        const { data: profile } = await supabase
          .from('zg_profiles')
          .select('name, email, locale')
          .eq('id', profileId)
          .single();

        if (profile) {
          finalToEmail = profile.email;
          // Replace variables like {{name}}, {{email}}
          const allVars = { ...variables, name: profile.name, email: profile.email };
          for (const [key, value] of Object.entries(allVars)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalSubject = finalSubject.replace(regex, value);
            finalHtmlBody = finalHtmlBody.replace(regex, value);
          }
        }
      }

      // Process attachments
      if (template.email_attachments && template.email_attachments.length > 0) {
        for (const attachment of template.email_attachments) {
          const { data: fileData } = await supabase.storage
            .from('email-attachments')
            .download(attachment.storage_path);

          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            attachments.push({
              filename: attachment.filename,
              content: buffer,
            });
          }
        }
      }
    }

    if (!finalToEmail) {
      throw new Error('Recipient email is required');
    }

    console.log('[funnel-send-email] Sending email to:', finalToEmail);

    const resend = new Resend(resendApiKey);

    const emailPayload: any = {
      from: `${finalFromName} <${finalFromEmail}>`,
      to: [finalToEmail],
      subject: finalSubject,
      html: finalHtmlBody,
    };

    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const { data: emailResult, error: emailError } = await resend.emails.send(emailPayload);

    if (emailError) {
      console.error('[funnel-send-email] Resend error:', emailError);
      
      // Log failure
      await supabase.from('email_logs').insert({
        profile_id: profileId,
        template_id: templateId,
        to_email: finalToEmail,
        subject: finalSubject,
        status: 'failed',
        error_message: emailError.message,
      });

      // Update queue if applicable
      if (queueId) {
        await supabase
          .from('email_queue')
          .update({ status: 'failed', error_message: emailError.message })
          .eq('id', queueId);
      }

      throw emailError;
    }

    console.log('[funnel-send-email] Email sent successfully:', emailResult);

    // Log success
    await supabase.from('email_logs').insert({
      profile_id: profileId,
      template_id: templateId,
      to_email: finalToEmail,
      subject: finalSubject,
      status: 'sent',
      resend_id: emailResult?.id,
    });

    // Update queue if applicable
    if (queueId) {
      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', queueId);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[funnel-send-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
