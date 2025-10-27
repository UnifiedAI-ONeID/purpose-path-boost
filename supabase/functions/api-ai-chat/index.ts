import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Lang = 'en' | 'zh-Hant' | 'zh-Hans'

const STEP_PROMPT: Record<Lang, Record<string, string>> = {
  en: {
    pathway:
      'Which situation fits you best?\n' +
      '1) Study in Canada (student permit)\n' +
      '2) Work in Canada (job offer / work permit)\n' +
      '3) Permanent Residence / PR (Express Entry / Skilled Worker)\n' +
      '4) Sponsor family (spouse / children / parents)\n' +
      '5) Business / Investor / Entrepreneur\n\n' +
      'Please reply with the number closest to you.\n\n' +
      'This is intake only and is not legal advice.',
    timeline:
      'When do you hope to be in Canada?\n' +
      '1) 0–6 months\n' +
      '2) 6–12 months\n' +
      '3) 12+ months\n\n' +
      'Reply with 1, 2, or 3.',
    family:
      'Are you applying alone, or with spouse / children?\n' +
      "Example: 'Just me' or 'Me + spouse + 1 child'.",
    citizenship:
      'Which country is your citizenship, and where are you living right now?\n' +
      "Example: 'Citizen of Malaysia, living in Singapore'.",
    email:
      'Great, thank you.\n' +
      'To send a free preparation checklist and propose a free 20-minute consultation with a licensed Canadian immigration professional in the next 1 business day, what is the best email address?\n\n' +
      'This is still intake only and not legal advice.',
    checklist:
      'Would you like us to email you a short PDF checklist of documents you may need for this pathway?\n' +
      'Reply YES or NO.',
    done:
      'Thank you. Our licensed team will review and email you within 24 hours with proposed times for a 20-minute consultation.\n' +
      'You can also book immediately here: https://cal.com/yourhandle\n\n' +
      'Reminder: This chat is for intake only and is not legal advice.',
  },
  'zh-Hant': {
    pathway:
      '請問您比較屬於以下哪一類？\n' +
      '1) 赴加留學（學生簽證）\n' +
      '2) 赴加工作（雇主聘用 / 工作許可）\n' +
      '3) 申請永久居民 / PR（技術移民 / 快速通道）\n' +
      '4) 家庭團聚（配偶 / 子女 / 父母）\n' +
      '5) 投資 / 創業 / 商業移民\n\n' +
      '請回覆對應的數字。\n\n' +
      '此為初步諮詢並非法律意見。',
    timeline:
      '您期望何時正式到加拿大？\n' +
      '1) 0–6個月內\n' +
      '2) 6–12個月內\n' +
      '3) 12個月以上\n\n' +
      '請回覆 1 / 2 / 3。',
    family:
      '您是單獨申請，還是包含配偶 / 子女？\n' +
      '例如：「只有我」或「我+配偶+1小孩」。',
    citizenship:
      '您的國籍是什麼？目前居住在哪裡？\n' +
      '例如：「馬來西亞籍，目前住新加坡」。',
    email:
      '了解，謝謝您。\n' +
      '我們可以在1個工作天內寄給您準備清單(PDF)並提供免費20分鐘諮詢（由加拿大持牌移民顧問）。\n' +
      '請留下最佳聯絡電郵。\n\n' +
      '此為初步諮詢，並非法律意見。',
    checklist: '需要我們把文件準備清單( PDF )寄給您嗎？\n' + '回覆 YES 或 NO。',
    done:
      '已收到。持牌顧問團隊會在24小時內回覆，並提出20分鐘免費諮詢時間。\n' +
      '您也可以直接預約：https://cal.com/yourhandle\n\n' +
      '提醒：此對話為初步諮詢，並非法律意見。',
  },
  'zh-Hans': {
    pathway:
      '请问您比较属于以下哪一类？\n' +
      '1) 去加拿大留学（学生签证）\n' +
      '2) 去加拿大工作（雇主聘用 / 工签）\n' +
      '3) 永久居民 / PR（技术移民 / 快速通道）\n' +
      '4) 家庭团聚（配偶 / 子女 / 父母）\n' +
      '5) 投资 / 创业 / 商业移民\n\n' +
      '请回复对应的数字。\n\n' +
      '本次为初步咨询，并非法律建议。',
    timeline:
      '您希望多久内抵达加拿大？\n' +
      '1) 0–6个月\n' +
      '2) 6–12个月\n' +
      '3) 12个月以上\n\n' +
      '请回复 1 / 2 / 3。',
    family:
      '您是自己申请，还是包含配偶 / 子女？\n' +
      '例如："只有我"或"我+配偶+1个小孩"。',
    citizenship:
      '您的国籍是？目前住在哪个国家/地区？\n' +
      '例如："马来西亚国籍，目前住新加坡"。',
    email:
      '了解，谢谢您。\n' +
      '我们可以在1个工作日内把准备清单(PDF)以及免费20分钟咨询时间(由加拿大持牌移民顾问)发到您的邮箱。\n' +
      '请留下最方便联系的邮箱。\n\n' +
      '此为初步咨询，并非法律建议。',
    checklist: '需要我们把文件准备清单(PDF)发给您吗？\n' + '请回复 YES 或 NO。',
    done:
      '收到。我们的持牌顾问会在24小时内电邮您，并提供免费20分钟咨询时间。\n' +
      '您也可以直接预约：https://cal.com/yourhandle\n\n' +
      '提醒：此对话为初步咨询，不是法律建议。',
  },
}

async function askGemini(
  convoText: string,
  stage: string,
  lang: Lang,
  theme: { firmName: string; tone: string }
): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY')
  if (!apiKey) {
    return 'Thank you for sharing. This chat is not legal advice. A licensed Canadian immigration professional will review your case.'
  }

  const systemPrompt =
    `You are the Intake Concierge for ${theme.firmName}, a licensed Canadian immigration practice.\n` +
    `Tone: ${theme.tone}.\n` +
    `Your job is to reassure, summarize what they said, and keep them calmly moving to the NEXT STEP.\n` +
    `Never promise approval or eligibility.\n` +
    `Always say: "This chat is not legal advice. A licensed Canadian immigration professional will review your case."\n` +
    `Be concise, readable on mobile, and reply in ${
      lang === 'en'
        ? 'English'
        : lang === 'zh-Hant'
        ? 'Traditional Chinese'
        : 'Simplified Chinese'
    }.\n` +
    `Current intake step: ${stage}.\n`

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text:
                    systemPrompt +
                    '\n\nConversation so far:\n' +
                    convoText +
                    '\n\nReply now:',
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Thank you for sharing. This chat is not legal advice. A licensed Canadian immigration professional will review your case.'
    return text.trim()
  } catch (error) {
    console.error('Gemini API error:', error)
    return lang === 'en'
      ? 'Thank you. A licensed Canadian immigration professional will review this. This chat is not legal advice.'
      : '感謝您。此對話為初步諮詢，並非法律意見，加拿大持牌顧問會審閱您的情況。'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const stage = body.stage || 'pathway'
    const lang: Lang = body.lang || 'en'
    const theme = body.theme || {
      firmName: 'Amelda & Mayshahid Associates Co.',
      tone: 'calm, respectful, compliant, reassuring, experienced, licensed Canadian immigration professionals',
    }

    const messages = body.messages || []
    const leadEmail = body.leadEmail || null
    const leadSnapshot = body.leadSnapshot || null
    const wantsChecklist = body.wantsChecklist || null

    const convoText = messages
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n')

    let reassurance = await askGemini(convoText, stage, lang, theme)

    let nextPrompt = STEP_PROMPT[lang][stage] || STEP_PROMPT[lang]['done']

    if (stage === 'checklist') {
      nextPrompt = STEP_PROMPT[lang]['checklist']
    }

    if (leadEmail || wantsChecklist) {
      const baseLead: any = {
        email: leadEmail,
        stage: 'chat_engaged',
        locale: lang,
      }

      if (leadSnapshot) {
        if (leadSnapshot.pathway) baseLead.pathway = leadSnapshot.pathway
        if (leadSnapshot.timeline) baseLead.timeline = leadSnapshot.timeline
        if (leadSnapshot.family) baseLead.family_details = leadSnapshot.family
        if (leadSnapshot.citizenship)
          baseLead.country_of_citizenship = leadSnapshot.citizenship
        if (leadSnapshot.location) baseLead.current_location = leadSnapshot.location
      }

      if (typeof wantsChecklist === 'string') {
        baseLead.needs_checklist = wantsChecklist.trim().toUpperCase() === 'YES'
      }

      await supabase.from('leads').upsert(baseLead, { onConflict: 'email' })
    }

    const text = `${reassurance}\n\n${nextPrompt}`.trim()

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
