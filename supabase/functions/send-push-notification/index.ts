import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const expoPushApiUrl = 'https://exp.host/--/api/v2/push/send'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    // We are expecting { user_id, title, body, type, reference_id }
    const { user_id, title, body, type, reference_id } = payload

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id in record' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Initialize Supabase client with Service Role Key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch the user's expo_push_token from their profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('expo_push_token')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile or profile not found:', profileError)
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const pushToken = profile.expo_push_token

    if (!pushToken) {
      console.log('User does not have an Expo push token, skipping notification.')
      return new Response(JSON.stringify({ message: 'User has no push token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send the push notification via Expo
    const pushPayload = {
      to: pushToken,
      title: title,
      body: body,
      data: {
        type: type || 'alert',
        referenceId: reference_id,
      },
      sound: 'default'
    }

    console.log('Sending push notification:', pushPayload)

    const response = await fetch(expoPushApiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushPayload),
    })

    const result = await response.json()
    console.log('Expo push response:', result)

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in send-push-notification:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
