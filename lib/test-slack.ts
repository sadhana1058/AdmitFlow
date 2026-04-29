import { config } from 'dotenv'
config({ path: '.env.local' })
import { notifySlack } from './slack'

notifySlack('AdmitFlow connected. Slack integration working.', 'info')
  .then(console.log)
  .catch(console.error)
