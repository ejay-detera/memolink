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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error("Missing required environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch entries that don't have a summary yet
    const { data: entries, error: fetchError } = await supabase
      .from('journal_entries')
      .select('id, raw_text')
      .is('summary_text', null)
      .not('raw_text', 'is', null)
      .limit(10);

    if (fetchError) throw fetchError;

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a helpful assistant for a senior care application.
Your task is to read the provided raw journal entry from a senior and create a brief, compassionate, and clear 1-3 sentence summary.
This summary will be shown to their family members or caregivers.
Focus on their mood, activities, and any significant events.
Do not use first person ("I"). Use third person or neutral framing.`;

    let processedCount = 0;

    for (const entry of entries) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: entry.raw_text }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

          if (summary) {
            await supabase
              .from('journal_entries')
              .update({
                summary_text: summary,
                summarized_at: new Date().toISOString(),
              })
              .eq('id', entry.id);
            
            processedCount++;
          }
        }
      } catch (err) {
        console.error(`Failed to process entry ${entry.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
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
