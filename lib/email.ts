import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const FROM_EMAIL = 'ForeverPic <noreply@foreverpic.app>'

export async function sendWelcomeEmail(to: string, name?: string | null) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping welcome email')
    return
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Benvenuto su ForeverPic! 🎉',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #e85d4c, #c9a84c); border-radius: 16px; margin: 0 auto 16px;"></div>
            <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: #1a1a1a;">ForeverPic</h1>
          </div>

          <div style="background: #faf8f5; border-radius: 20px; padding: 32px;">
            <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 16px;">Ciao${name ? ' ' + name : ''}! 👋</h2>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #4a4a4a;">
              Benvenuto su <strong>ForeverPic</strong>, il modo più semplice per raccogliere e condividere le foto dei tuoi eventi.
            </p>

            <div style="background: white; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e8e4df;">
              <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 12px;">Cosa puoi fare:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; line-height: 1.8;">
                <li>Crea un evento in pochi secondi</li>
                <li>Genera un QR code per condividerlo</li>
                <li>Raccogli foto in tempo reale dagli ospiti</li>
                <li>Scarica tutte le foto con un click</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #8a8a8a; margin: 24px 0 0;">
              Questa è una versione beta gratuita. Gli eventi creati si cancelleranno automaticamente dopo 7 giorni.
            </p>
          </div>

          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e8e4df;">
            <p style="font-size: 13px; color: #aaa; margin: 0;">
              ForeverPic — Galleria foto per eventi<br/>
              <a href="https://foreverpic-beta.vercel.app" style="color: #e85d4c; text-decoration: none;">foreverpic-beta.vercel.app</a>
            </p>
          </div>
        </div>
      `,
    })

    console.log('[email] Welcome email sent to', to)
  } catch (error) {
    console.error('[email] Failed to send welcome email:', error)
  }
}
