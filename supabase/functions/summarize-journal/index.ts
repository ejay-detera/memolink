// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { rawText } = await req.json();

    if (!rawText) {
      return new Response(JSON.stringify({ error: 'Missing rawText' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    const systemPrompt = `You are a helpful assistant for a senior care application.
Your task is to read the provided raw journal entry from a senior and create a brief, compassionate, and clear 1-3 sentence summary.
This summary will be shown to their family members or caregivers.
Focus on their mood, activities, and any significant events.
Do not use first person ("I"). Use third person or neutral framing.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: rawText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.candidates[0].content.parts[0].text.trim();

    return new Response(JSON.stringify({ summary }), {
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
