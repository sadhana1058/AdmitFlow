import { config } from 'dotenv'
config({ path: '.env.local' })
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})

const sheets = google.sheets({ version: 'v4', auth })

async function test() {
  // First just try to get spreadsheet metadata (no range needed)
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID as string,
  })
  console.log('Title:', meta.data.properties?.title)
  console.log('Sheets:', meta.data.sheets?.map(s => s.properties?.title))
}

test().catch((err: any) => {
  console.log('Status:', err.status)
  console.log('Message:', err.message)
})
