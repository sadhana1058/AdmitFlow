import { config } from 'dotenv'
config({ path: '.env.local' })

import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const RANGE = 'Sheet1!A:H'

export interface Applicant {
  name: string
  email: string
  status: string
  missingDocs: string
  gpa: string
  fafsaEfc: string
  lastAction: string
  timestamp: string
  row: number
}

export async function readApplicants(): Promise<Applicant[]> {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID!
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values
  if (!rows || rows.length < 2) return []

  return rows.slice(1).map((row, index) => ({
    name:        row[0] || '',
    email:       row[1] || '',
    status:      row[2] || '',
    missingDocs: row[3] || '',
    gpa:         row[4] || '',
    fafsaEfc:    row[5] || '',
    lastAction:  row[6] || '',
    timestamp:   row[7] || '',
    row:         index + 2,
  }))
}

export async function lookupStudent(identifier: string): Promise<Applicant | null> {
  const applicants = await readApplicants()
  const found = applicants.find(
    a =>
      a.name.toLowerCase().includes(identifier.toLowerCase()) ||
      a.email.toLowerCase().includes(identifier.toLowerCase())
  )
  return found || null
}

export async function updateStatus(
  applicantName: string,
  status: string,
  notes: string
): Promise<{ success: boolean; row: number }> {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID!
  const applicants = await readApplicants()
  const applicant = applicants.find(a =>
    a.name.toLowerCase().includes(applicantName.toLowerCase())
  )

  if (!applicant) return { success: false, row: -1 }

  const now = new Date().toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  })

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `Sheet1!C${applicant.row}`, values: [[status]] },
        { range: `Sheet1!G${applicant.row}`, values: [[notes]] },
        { range: `Sheet1!H${applicant.row}`, values: [[now]] },
      ],
    },
  })

  return { success: true, row: applicant.row }
}
