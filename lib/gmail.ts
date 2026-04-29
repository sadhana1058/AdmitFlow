import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId: string }> {
  const info = await getTransporter().sendMail({
    from: `"Riverside University Admissions" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text: body,
  })
  return { success: true, messageId: info.messageId }
}
