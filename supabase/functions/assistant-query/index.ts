// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { question, userId, userRole, seniorId } = await req.json();

    if (!question || !userId || !userRole) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Connection Security Check (for caregivers)
    let targetSeniorId = userId;
    if (userRole === 'caregiver') {
      if (!seniorId) {
        return new Response(JSON.stringify({ error: 'seniorId required for caregivers' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      
      const { data: conn } = await supabase
        .from('caregiver_senior_connections')
        .select('id')
        .eq('caregiver_id', userId)
        .eq('senior_id', seniorId)
        .eq('status', 'accepted')
        .single();
        
      if (!conn) {
        return new Response(JSON.stringify({ answer: "I'm unable to access that information right now." }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      targetSeniorId = seniorId;
    }

    // 2. Classify Intent via Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    const intentSystemPrompt = `You are an intent classifier for a senior care app.
Classify the user's question into exactly one category:
- "schedule" — asking about appointments, doctor visits, upcoming events
- "medication" — asking about medicines, doses, whether they took pills
- "journal" — asking about their journal, memories they wrote, feelings, mood
- "vault" — asking about photos, files, uploaded memories, albums
- "routine" — asking about daily routines, habits, morning/evening activities
- "companion" — general conversation, greetings, chatting, life advice, or anything not covered by the above.
- "unknown" — ONLY use this if the input is completely incomprehensible.

Return ONLY a valid JSON object in this format, and nothing else:
{
  "intent": "schedule|medication|journal|vault|routine|companion|unknown",
  "search_term": "extracted term or null",
  "companion_response": "If the intent is 'companion', write your friendly, empathetic, and patient response here. Act as a loving grandchild or a patient caregiver using short, warm sentences. Otherwise, null."
}`;

    const intentResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Question: "${question}"` }] }],
        systemInstruction: { parts: [{ text: intentSystemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!intentResponse.ok) {
      throw new Error(`Gemini intent API failed: ${intentResponse.statusText}`);
    }

    const intentData = await intentResponse.json();
    const rawIntentText = intentData.candidates[0].content.parts[0].text;
    
    let classification = { intent: "unknown", search_term: null, companion_response: null };
    try {
      classification = JSON.parse(rawIntentText);
    } catch (e) {
      console.error("Failed to parse intent JSON:", rawIntentText);
    }

    const intent = classification.intent;

    // Fast-path for companion to save a second LLM call
    if (intent === 'companion' && classification.companion_response) {
      return new Response(JSON.stringify({ answer: classification.companion_response, intent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Query Database based on Intent
    let contextData = {};
    const today = new Date().toISOString().split('T')[0];

    if (intent === 'schedule' || intent === 'routine') {
      const { data: appointments } = await supabase
        .from('medical_appointments')
        .select('title, appointment_date, start_time, end_time, doctor_name, location, notes')
        .eq('senior_id', targetSeniorId)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .limit(10);
        
      const { data: routines } = await supabase
        .from('routines')
        .select('title, start_time, end_time, description, category, recurrence')
        .eq('user_id', targetSeniorId);
        
      contextData = { appointments: appointments || [], routines: routines || [] };
    } 
    else if (intent === 'medication') {
      const { data: medications } = await supabase
        .from('medications')
        .select('id, name, dosage, instructions, times, schedule_type')
        .eq('senior_id', targetSeniorId)
        .eq('is_active', true);
        
      const medIds = medications?.map((m: any) => m.id) || [];
      let logs = [];
      if (medIds.length > 0) {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const { data: medLogs } = await supabase
          .from('medication_logs')
          .select('medication_id, status, logged_at')
          .in('medication_id', medIds)
          .gte('logged_at', todayStart.toISOString());
        logs = medLogs || [];
      }
      contextData = { medications: medications || [], logs };
    }
    else if (intent === 'journal') {
      const { data: journals } = await supabase
        .from('journal_entries')
        .select('summary_text, raw_text, mood, created_at')
        .eq('user_id', targetSeniorId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      // Strip raw_text for caregivers
      const safeJournals = (journals || []).map((j: any) => ({
        ...j,
        raw_text: userRole === 'caregiver' ? undefined : j.raw_text
      }));
      contextData = { journals: safeJournals };
    }
    else if (intent === 'vault') {
      const { data: folders } = await supabase
        .from('memory_folders')
        .select('id, name, desc, folder_date, created_at')
        .eq('user_id', targetSeniorId);
        
      contextData = { folders: folders || [] };
    }

    // 4. Generate Response via Gemini
    if (intent === 'unknown') {
      return new Response(JSON.stringify({ 
        answer: "I'm sorry, I didn't quite catch that. Could you try asking again?", 
        intent 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const responseSystemPrompt = `You are a friendly, compassionate, and patient companion and assistant for a senior user. 
Answer their question warmly.
- If they are just chatting, engage them in a gentle, conversational way. Ask caring follow-up questions.
- If they are asking for data, answer based on the provided data context.
- Use short, clear sentences and simple, warm language. No jargon. Speak clearly and directly.
- Speak with respect, warmth, and empathy. Imagine you are a loving grandchild or a patient caregiver.
- If the data is empty and they asked for data, say gently that you couldn't find anything related to that (e.g. "You don't have any medications scheduled for today."). Do not mention "database" or "system".
- It is currently ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}. Use this context when they ask about "today" or "now".`;

    const finalPrompt = `Question: "${question}"\n\nData Context (JSON):\n${JSON.stringify(contextData)}`;

    const answerResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        systemInstruction: { parts: [{ text: responseSystemPrompt }] }
      })
    });

    if (!answerResponse.ok) {
      throw new Error(`Gemini answer API failed: ${answerResponse.statusText}`);
    }

    const answerData = await answerResponse.json();
    const answerText = answerData.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ answer: answerText, intent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
