import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  booking_id: number
  template_name: string
  recipient_email: string
  recipient_name?: string
  variables?: Record<string, any>
  force_send?: boolean // For testing
}

interface EmailTemplate {
  id: number
  template_name: string
  subject: string
  html_content: string
  variables: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const contentType = req.headers.get('content-type') || ''
    let requestData: EmailRequest

    try {
      const body = await req.text()
      console.log('📧 Raw request body:', body)
      requestData = JSON.parse(body)
      console.log('📧 Parsed email request:', requestData)
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      throw new Error(`Invalid JSON in request body: ${parseError.message}`)
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_name', requestData.template_name)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      throw new Error(`Email template '${requestData.template_name}' not found`)
    }

    // Replace variables in subject and content
    let subject = template.subject
    let htmlContent = template.html_content

    if (requestData.variables) {
      Object.keys(requestData.variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        subject = subject.replace(regex, String(requestData.variables![key]))
        htmlContent = htmlContent.replace(regex, String(requestData.variables![key]))
      })
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SparklePro <onboarding@resend.dev>', // Will be changed to your domain later
        to: [requestData.recipient_email],
        subject: subject,
        html: htmlContent,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    console.log('✅ Email sent successfully:', resendData)

    // Log email in database
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        booking_id: requestData.booking_id,
        recipient_email: requestData.recipient_email,
        recipient_name: requestData.recipient_name,
        template_name: requestData.template_name,
        subject: subject,
        status: 'sent',
        resend_id: resendData.id,
        sent_at: new Date().toISOString(),
      })

    if (logError) {
      console.error('❌ Failed to log email:', logError)
      // Don't throw here - email was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        resend_id: resendData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Email sending failed:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* To deploy this function, run:
npx supabase functions deploy send-email --no-verify-jwt
*/
