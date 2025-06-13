import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, name, phone, userClassId, accessProfileId, managerId } = await req.json()

    console.log('Creating user with email:', email)

    // Create user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }

    console.log('User created successfully:', authData.user?.id)

    // Update the profile with additional data
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name,
          phone: phone || null,
          user_class_id: userClassId || null,
          access_profile_id: accessProfileId || null,
          manager_id: managerId || null
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw profileError
      }

      console.log('Profile updated successfully')
    }

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})