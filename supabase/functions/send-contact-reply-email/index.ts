import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactReplyRequest {
  userEmail: string;
  userName: string;
  subject: string;
  adminResponse: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, subject, adminResponse }: ContactReplyRequest = await req.json();

    console.log(`Sending reply email to ${userEmail} for subject: ${subject}`);

    const emailResponse = await resend.emails.send({
      from: "Arova Forex <onboarding@resend.dev>", // Change to your verified domain
      to: [userEmail],
      subject: `Re: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 32px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 32px;
                padding-bottom: 24px;
                border-bottom: 2px solid #10b981;
              }
              .logo {
                font-size: 32px;
                font-weight: 800;
                background: linear-gradient(135deg, #10b981, #059669);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 8px;
              }
              .title {
                color: #1f2937;
                font-size: 24px;
                font-weight: 700;
                margin: 16px 0;
              }
              .greeting {
                font-size: 16px;
                color: #4b5563;
                margin-bottom: 24px;
              }
              .message-box {
                background-color: #f9fafb;
                border-left: 4px solid #10b981;
                padding: 20px;
                margin: 24px 0;
                border-radius: 4px;
              }
              .response-text {
                color: #1f2937;
                font-size: 15px;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .footer {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 16px 0;
              }
              .subject-reference {
                color: #6b7280;
                font-size: 14px;
                margin-top: 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Arova Forex</div>
                <div style="color: #10b981; font-size: 14px; font-weight: 600;">Support Team</div>
              </div>
              
              <h1 class="title">Response to Your Inquiry</h1>
              
              <p class="greeting">Hi ${userName},</p>
              
              <p style="color: #4b5563;">Thank you for reaching out to us. We've reviewed your message and here's our response:</p>
              
              <div class="message-box">
                <div class="response-text">${adminResponse}</div>
              </div>
              
              <p class="subject-reference"><strong>Original Subject:</strong> ${subject}</p>
              
              <div style="text-align: center;">
                <a href="https://your-app-url.com/support" class="button">View in Dashboard</a>
              </div>
              
              <p style="color: #4b5563; margin-top: 24px;">
                If you have any additional questions or concerns, please don't hesitate to reply to this email or submit a new message through our contact form.
              </p>
              
              <div class="footer">
                <p><strong>Arova Forex Support Team</strong></p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-reply-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
