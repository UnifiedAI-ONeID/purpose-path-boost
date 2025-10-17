import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 200);
  }

  try {
    const s = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { device_id, profile_id, question_key, choice_value } = await req.json();
    
    const { error: answerError } = await s.from('zg_quiz_answers').insert([{
      device_id,
      profile_id,
      question_key,
      choice_value
    }]);
    
    if (answerError) {
      console.error('[api-quiz-answer] Answer insert error:', answerError);
    }
    
    const { error: eventError } = await s.from('zg_events').insert([{
      device_id,
      profile_id,
      event: 'quiz_answer',
      payload: { question_key, choice_value }
    }]);
    
    if (eventError) {
      console.error('[api-quiz-answer] Event insert error:', eventError);
    }
    
    return jsonResponse({ ok: true }, 200);
  } catch (e: any) {
    console.error('[api-quiz-answer] Error:', e);
    return jsonResponse({ ok: false, error: e.message || 'Unknown error' }, 200);
  }
});
