import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { fetch } }
    );

    // Get pending emails that are due to be sent
    const { data: pendingEmails, error: queueError } = await supabase
      .from('email_queue')
      .select('*, email_templates(*), zg_profiles(*)')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50);

    if (queueError) throw queueError;

    console.log(`[funnel-process-queue] Found ${pendingEmails?.length || 0} emails to send`);

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        // Call send email function
        const sendResponse = await supabase.functions.invoke('funnel-send-email', {
          body: {
            profileId: email.profile_id,
            templateId: email.template_id,
            queueId: email.id,
            variables: email.metadata || {},
          },
        });

        if (sendResponse.error) {
          console.error(`[funnel-process-queue] Failed to send email ${email.id}:`, sendResponse.error);
          failureCount++;
        } else {
          console.log(`[funnel-process-queue] Successfully sent email ${email.id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`[funnel-process-queue] Error sending email ${email.id}:`, error);
        failureCount++;
      }
    }

    // Process funnel auto-progression
    const { data: activeStages } = await supabase
      .from('funnel_stages')
      .select('*')
      .eq('active', true)
      .eq('auto_progress', true)
      .order('order_index');

    if (activeStages && activeStages.length > 0) {
      for (const stage of activeStages) {
        // Find next stage
        const nextStage = activeStages.find(s => s.order_index === stage.order_index + 1);
        if (!nextStage) continue;

        // Find users ready to progress
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - stage.delay_hours);

        const { data: readyUsers } = await supabase
          .from('user_funnel_progress')
          .select('profile_id')
          .eq('stage_id', stage.id)
          .is('completed_at', null)
          .lte('entered_at', cutoffTime.toISOString());

        if (readyUsers && readyUsers.length > 0) {
          for (const user of readyUsers) {
            // Mark current stage as complete
            await supabase
              .from('user_funnel_progress')
              .update({ completed_at: new Date().toISOString() })
              .eq('profile_id', user.profile_id)
              .eq('stage_id', stage.id);

            // Enroll in next stage
            await supabase
              .from('user_funnel_progress')
              .insert({
                profile_id: user.profile_id,
                stage_id: nextStage.id,
              })
              .onConflict('profile_id,stage_id')
              .ignoreDuplicates();

            // Queue email for next stage
            const { data: nextTemplate } = await supabase
              .from('email_templates')
              .select('id')
              .eq('stage_id', nextStage.id)
              .eq('active', true)
              .limit(1)
              .single();

            if (nextTemplate) {
              await supabase.from('email_queue').insert({
                profile_id: user.profile_id,
                template_id: nextTemplate.id,
                scheduled_for: new Date().toISOString(),
              });
            }
          }
          console.log(`[funnel-process-queue] Progressed ${readyUsers.length} users from ${stage.name} to ${nextStage.name}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Queue processed successfully',
        emailsSent: successCount,
        emailsFailed: failureCount,
        totalProcessed: successCount + failureCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[funnel-process-queue] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
