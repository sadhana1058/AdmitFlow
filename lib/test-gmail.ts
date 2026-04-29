import { config } from 'dotenv'
config({ path: '.env.local' })
import { sendEmail } from './gmail'

sendEmail(
  process.env.GMAIL_USER as string,
  'AdmitFlow test',
  'Gmail integration working.'
).then(console.log).catch(console.error)
