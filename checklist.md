# AdmitFlow — 6 Hour Build Checklist
### Backend → Frontend → Integration

---

## Hour 1 — Data & Config Foundation
> **Goal: All data sources ready, env wired up**

[X] Fill `.env.local` with all keys
  ```
  GEMINI_API_KEY=
  GOOGLE_SERVICE_ACCOUNT_EMAIL=
  GOOGLE_PRIVATE_KEY=
  GOOGLE_SHEET_ID=
  SLACK_WEBHOOK_URL=
  GMAIL_USER=
  ```
- [ ] Create Google Sheet with 4 fake applicants using this schema

  | Name | Email | Status | Missing Docs | GPA | FAFSA EFC | Last Action | Timestamp |
  |---|---|---|---|---|---|---|---|
  | Sarah Chen | sarah@riverside.edu | Complete | — | 3.8 | $2,100 | — | — |
  | James Okafor | james@riverside.edu | Missing Docs | Transcript | 3.5 | $4,200 | — | — |
  | Maria Lopez | maria@riverside.edu | Complete | — | 3.9 | $1,800 | — | — |
  | Alex Kim | alex@riverside.edu | In Review | — | 3.6 | $3,400 | — | — |

- [ ] Write `data/policy.txt` — Riverside University fake policy doc covering:
  - [ ] Application deadlines (Fall: May 1 / Spring: Nov 1)
  - [ ] Missing document grace period (14 days)
  - [ ] Financial aid eligibility thresholds
  - [ ] Deferral request rules (30 days before term)
  - [ ] Email tone guidelines
  - [ ] Escalation triggers

- [ ] Write `lib/sheets.ts` with two functions:
  - [ ] `readApplicants()` — reads all rows from sheet
  - [ ] `updateStatus(name, status, notes)` — writes back to sheet

- [ ] Test `lib/sheets.ts` in isolation
  ```bash
  npx ts-node -e "import {readApplicants} from './lib/sheets'; readApplicants().then(console.log)"
  ```

### ✅ Exit Check
> `readApplicants()` returns your 4 fake rows printed in the terminal

---

## Hour 2 — Agent Tools & Gemini Core
> **Goal: Agent brain works, all tools callable**

- [ ] Write `lib/gmail.ts`
  - [ ] `sendEmail(to, subject, body)` — sends real email via Gmail API
  - [ ] Test by sending one real email to yourself

- [ ] Write `lib/slack.ts`
  - [ ] `notifySlack(message, urgency)` — POST to Slack incoming webhook
  - [ ] Test by posting one real message to your Slack channel

- [ ] Write `lib/tools.ts` — all 6 tools in Gemini function calling format
  - [ ] `read_applicants` — no params, returns all rows
  - [ ] `send_email` — params: to, subject, body
  - [ ] `update_status` — params: applicantName, status, notes
  - [ ] `notify_slack` — params: message, urgency
  - [ ] `lookup_student` — params: identifier (name or email)
  - [ ] `escalate_to_advisor` — params: studentName, reason

- [ ] Write `lib/gemini.ts`
  - [ ] Gemini client initialisation with API key
  - [ ] System prompt builder (injects policy doc + active module)
  - [ ] Tool execution loop (receives tool call → runs real function → returns result)
  - [ ] Streaming handler

- [ ] Write `app/api/agent/route.ts`
  - [ ] Accepts POST with `{ prompt, module }`
  - [ ] Runs Gemini agent with correct module context
  - [ ] Streams SSE back to client
  - [ ] Handles tool calls mid-stream

- [ ] Test via curl
  ```bash
  curl -X POST http://localhost:3000/api/agent \
    -H "Content-Type: application/json" \
    -d '{"prompt": "process all pending applications", "module": "admissions"}'
  ```

### ✅ Exit Check
> Terminal shows agent tool calls streaming — reads sheet, decides actions, returns results. No frontend needed.

---

## Hour 3 — All 3 Agent Modules Working
> **Goal: All 3 modules return correct results via API**

- [ ] **Module 1 — Admissions Automation**
  - [ ] System prompt set to admissions context
  - [ ] Agent reads sheet → reasons per applicant → calls send_email + update_status + notify_slack
  - [ ] Test: `"Process all pending applications"` → 3 emails sent, sheet updated, Slack fired
  - [ ] Confirm emails arrive in real inbox
  - [ ] Confirm Slack message appears in channel
  - [ ] Confirm sheet rows updated

- [ ] **Module 2 — Student Services**
  - [ ] System prompt set to student-services context
  - [ ] Agent calls lookup_student → reads policy → forms personalised answer
  - [ ] Simple case: financial aid question → direct answer
  - [ ] Complex case: deferral request → escalate_to_advisor fires Slack alert
  - [ ] Test: `"Am I eligible for financial aid? I'm James Okafor"` → policy-accurate response

- [ ] **Module 3 — Cross-Dept Handoffs**
  - [ ] System prompt set to handoffs context
  - [ ] Agent fires 5 tools in sequence — no skipping, no parallel
  - [ ] Step order: update_status → send_email (aid) → update_status (housing) → update_status (orientation) → send_email (welcome)
  - [ ] Test: `"Maria Lopez just accepted her offer"` → all 5 steps complete in order

### ✅ Exit Check
> All 3 modules verified via curl or Postman. Real emails sent. Real Slack messages posted. Real sheet updated. Zero frontend written yet.

---

## Hour 4 — Frontend Shell + Shared Components
> **Goal: App looks right, shared pieces built**

- [ ] Build `app/page.tsx` — use AI Studio to generate this
  - [ ] Dark theme layout
  - [ ] Left sidebar with 3 module tabs
  - [ ] Main panel area (changes per tab)
  - [ ] AdmitFlow logo/name in sidebar header
  - [ ] Riverside University label

- [ ] Build `components/PromptBar.tsx`
  - [ ] Text input field
  - [ ] Submit button with loading spinner
  - [ ] Disabled state while agent is running
  - [ ] Connects to `/api/agent` with correct module param

- [ ] Build `components/AgentTrace.tsx`
  - [ ] Reads SSE stream from API route
  - [ ] Renders each step as it arrives
  - [ ] Step icons: 🔍 reading, 📧 email, 💬 slack, 📊 update, ✓ done, ⚠ warning
  - [ ] Auto-scrolls to latest step
  - [ ] Clear button to reset trace

- [ ] Hook SSE stream end to end
  - [ ] `EventSource` in client connecting to `/api/agent`
  - [ ] Each streamed chunk appends a new step to trace
  - [ ] Stream closes cleanly when agent finishes

### ✅ Exit Check
> Type any prompt in the bar → AgentTrace panel fills with live steps as the agent runs. Looks clean on screen.

---

## Hour 5 — All 3 Module UIs
> **Goal: Each tab has its own working UI, fully wired**

- [ ] **Tab 1 — ApplicantTable.tsx**
  - [ ] Fetches applicant data from Google Sheet on load
  - [ ] Table columns: Name, Status badge, Missing Docs, Last Action, Timestamp
  - [ ] Status badge colours: Complete (green) / Missing Docs (amber) / In Review (blue) / Flagged (red)
  - [ ] Refreshes automatically after agent run completes
  - [ ] Agent trace panel shown alongside table
  - [ ] Prompt bar pre-filled with suggested prompt

- [ ] **Tab 2 — ChatInterface.tsx**
  - [ ] Chat bubble UI — student messages right, agent left
  - [ ] Response time badge (*"Responded in 4s"*)
  - [ ] Escalation badge on messages that triggered advisor alert
  - [ ] Input at bottom, send on Enter or button
  - [ ] Agent trace shown in collapsible panel below chat
  - [ ] Suggested starter questions shown when chat is empty

- [ ] **Tab 3 — PipelineView.tsx**
  - [ ] 5 step cards displayed vertically
  - [ ] Each card: icon, department name, status (Pending / Running / Done)
  - [ ] Cards animate to Done state as each step completes
  - [ ] Connecting line between cards lights up as pipeline progresses
  - [ ] Summary card at bottom when all 5 complete
  - [ ] Prompt bar accepts student name

### ✅ Exit Check
> All 3 tabs fully functional. Real data. Real actions. Real UI feedback. Switch between tabs mid-demo with no issues.

---

## Hour 6 — Integration, Polish & Deploy
> **Goal: Demo ready, deployed, README written**

- [ ] **Integration Testing**
  - [ ] Run full Module 1 demo — check emails, sheet, Slack
  - [ ] Run full Module 2 demo — simple case + escalation case
  - [ ] Run full Module 3 demo — all 5 pipeline steps
  - [ ] Switch between tabs mid-session — no state bleed
  - [ ] Reload page — data reloads correctly from sheet

- [ ] **Polish**
  - [ ] Consistent dark theme across all 3 tabs
  - [ ] Loading spinners on all async actions
  - [ ] Error states — what shows if API fails
  - [ ] Empty states — what shows before first prompt
  - [ ] Mobile check — at least not broken on small screen

- [ ] **README.md**
  - [ ] What AdmitFlow is (2 sentences)
  - [ ] The 3 modules explained
  - [ ] Tech stack listed
  - [ ] Setup instructions (env vars, Google Cloud, Slack)
  - [ ] How to run locally
  - [ ] Architecture diagram (ASCII is fine)
  - [ ] What you'd build next:
    - Multi-tenant config per institution stored in Postgres
    - Webhook triggers replacing manual prompts
    - Salesforce connector replacing Google Sheets
    - Full audit log for compliance

- [ ] **Deploy**
  - [ ] Push to GitHub (confirm `.env.local` is in `.gitignore`)
  - [ ] Connect repo to Vercel
  - [ ] Add all env vars in Vercel dashboard
  - [ ] Deploy and confirm live URL works
  - [ ] Test live URL with real demo flow

- [ ] **Final Demo Rehearsal**
  - [ ] Run full 5-minute demo script 3 times
  - [ ] Time each module (target under 20 seconds each)
  - [ ] Confirm Slack, Gmail, Sheet all responding on live URL

### ✅ Exit Check
> Live Vercel URL. GitHub repo public. 5-minute demo runs clean 3 times in a row.

---

## Full Exit Criteria Summary

| Hour | Done When |
|---|---|
| Hour 1 | `readApplicants()` prints 4 rows in terminal |
| Hour 2 | curl to `/api/agent` returns streaming tool calls |
| Hour 3 | All 3 modules verified via API — real emails, Slack, sheet |
| Hour 4 | Prompt → AgentTrace streams live on screen |
| Hour 5 | All 3 tabs fully functional with real data |
| Hour 6 | Live Vercel URL, demo runs clean 3 times |

---

## If You Fall Behind

| Cut this | Keep this |
|---|---|
| Module 4 reporting | Modules 1, 2, 3 |
| Mobile responsiveness | Desktop demo |
| Animations on pipeline | Pipeline functionality |
| Error handling polish | Core happy path |
| README detail | README exists |

**Never cut a working module to polish another one.**

---

*AdmitFlow — Built for Trelium Founding Engineer Application — April 2026*