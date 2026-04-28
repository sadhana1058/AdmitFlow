# AdmitFlow — Project Plan
### AI Admissions Agent for Higher Education
> Built as a portfolio project targeting Trelium (YC F25) Founding Engineer role

---

## Project Overview

**Name:** AdmitFlow  
**Tagline:** *One prompt. Every department. Zero manual work.*  
**Target Demo:** Trelium Founding Engineer application  
**Build Time:** 6–8 hours  
**Stack:** Next.js 14 + TypeScript + Tailwind + shadcn/ui + Gemini 2.5 Flash  

---

## What It Does

AdmitFlow is a mini version of Trelium's own product — an AI agent platform that handles university admissions workflows across 3 modules, using real integrations (Google Sheets, Gmail, Slack), grounded in school policy documents, with a live streaming trace UI.

---

## The 3 Modules

### Module 1 — Admissions Automation
**Trigger prompt:** *"Process all pending applications"*

The agent:
1. Reads all applicants from Google Sheets
2. Checks each applicant's document status
3. Drafts and sends policy-accurate emails via Gmail
4. Flags missing documents
5. Updates applicant status back to Google Sheets
6. Posts summary to Slack #admissions channel

**UI:** Live applicant table + streaming agent trace panel

---

### Module 2 — Student Services Chatbot
**Trigger:** Student types a question in plain English

The agent:
1. Looks up the student's record from Google Sheets
2. Reads the school policy document for relevant rules
3. Responds with a personalized, policy-accurate answer
4. Escalates complex cases to an advisor via Slack

**Example exchanges:**
```
Student: Am I eligible for the need-based grant?
Agent:   Based on your FAFSA (EFC $4,200) and enrollment 
         status, you qualify for $3,500. Disbursement Jan 15.

Student: What documents do I still need?
Agent:   Your transcript is missing. Deadline May 1st.
         Submit via the student portal.

Student: Can I defer my enrollment?
Agent:   Deferral requests must be submitted 30 days before 
         term start. Flagging your case for an advisor.
```

**UI:** Chat interface with response time indicator + escalation badge

---

### Module 3 — Cross-Department Handoffs
**Trigger prompt:** *"James Okafor just accepted his offer"*

The agent fires 5 sequential actions:
```
✓ Step 1: Offer Accepted     → Update sheet status
✓ Step 2: Financial Aid      → Send aid package email  
✓ Step 3: Housing            → Create housing application row
✓ Step 4: Orientation        → Add to orientation list
✓ Step 5: Welcome Packet     → Send welcome email to student
```

**UI:** Visual 5-step pipeline lighting up live as each action completes

---

### Module 4 — Reporting (Stretch Goal, Hour 7–8)
**Trigger prompt:** *"Generate this week's enrollment report"*

The agent:
1. Pulls all applicant data from Google Sheets
2. Calculates status breakdown
3. Flags anomalies vs prior week
4. Returns a formatted summary card

**UI:** Clean auto-generated report card with trend flags

---

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Pages + API routes |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | Pre-built UI components |
| Lucide Icons | Icon set |

### AI
| Technology | Purpose |
|---|---|
| Gemini 2.5 Flash | Agent reasoning + function calling |
| @google/genai SDK | Official Google AI SDK |
| Function Calling | Gives agent real executable tools |
| SSE Streaming | Streams agent trace to UI in real time |

### Integrations
| Service | Purpose | Method |
|---|---|---|
| Google Sheets | Applicant database (the "SIS") | googleapis npm |
| Gmail | Sends real student emails | googleapis npm |
| Slack | Notifies #admissions channel | Incoming Webhook |

### Hosting (All Free)
| Service | What |
|---|---|
| Vercel | Hosts Next.js app |
| Google Cloud | Sheets + Gmail APIs (free tier) |
| Google AI Studio | Gemini API key (free tier) |

---

## Project File Structure

```
admitflow/
├── app/
│   ├── page.tsx                      ← Main layout + sidebar
│   ├── layout.tsx                    ← Root layout
│   └── api/
│       └── agent/
│           └── route.ts              ← Gemini + tool execution + SSE stream
├── components/
│   ├── Sidebar.tsx                   ← Module navigation
│   ├── PromptBar.tsx                 ← Shared prompt input
│   ├── AgentTrace.tsx                ← Live streaming trace panel
│   ├── admissions/
│   │   └── ApplicantTable.tsx        ← Module 1 dashboard
│   ├── student-services/
│   │   └── ChatInterface.tsx         ← Module 2 chat UI
│   ├── handoffs/
│   │   └── PipelineView.tsx          ← Module 3 pipeline UI
│   └── reporting/
│       └── ReportCard.tsx            ← Module 4 report UI
├── lib/
│   ├── gemini.ts                     ← Gemini client + streaming setup
│   ├── sheets.ts                     ← Google Sheets read/write wrapper
│   ├── gmail.ts                      ← Gmail send wrapper
│   ├── slack.ts                      ← Slack webhook wrapper
│   └── tools.ts                      ← All 6 agent tool definitions
├── data/
│   └── policy.txt                    ← Riverside University policy doc
├── types/
│   └── index.ts                      ← Shared TypeScript types
└── .env.local                        ← API keys (never committed)
```

---

## Agent Tools (Function Definitions)

```typescript
// Tool 1 — Read all applicants from Google Sheet
read_applicants()
→ returns: [{ name, email, status, missingDocs, gpa }]

// Tool 2 — Send email via Gmail
send_email(to: string, subject: string, body: string)
→ returns: { success: boolean, messageId: string }

// Tool 3 — Update applicant status in Google Sheet
update_status(applicantName: string, status: string, notes: string)
→ returns: { success: boolean, row: number }

// Tool 4 — Notify Slack channel
notify_slack(message: string, urgency: 'info' | 'warning' | 'alert')
→ returns: { success: boolean }

// Tool 5 — Look up individual student record
lookup_student(identifier: string)
→ returns: { name, email, status, fafsa, gpa, missingDocs }

// Tool 6 — Escalate to human advisor
escalate_to_advisor(studentName: string, reason: string)
→ returns: { success: boolean, ticketId: string }
```

---

## Google Sheet Structure

| Name | Email | Status | Missing Docs | GPA | FAFSA EFC | Last Action | Timestamp |
|---|---|---|---|---|---|---|---|
| Sarah Chen | sarah@... | Complete | — | 3.8 | $2,100 | Email sent | 10:02am |
| James Okafor | james@... | Missing Docs | Transcript | 3.5 | $4,200 | Flagged | 10:03am |
| Maria Lopez | maria@... | Complete | — | 3.9 | $1,800 | Email sent | 10:04am |
| Alex Kim | alex@... | In Review | — | 3.6 | $3,400 | Pending | — |

---

## System Prompt Design

Every agent request includes:

```
You are an AI admissions agent for Riverside University.
You handle student communications and admissions workflows 
strictly according to the provided policy documents.

POLICY DOCUMENT:
{contents of data/policy.txt}

CURRENT DATE: {date}
ACTIVE MODULE: {admissions | student-services | handoffs}

Always:
- Reference specific policy rules when making decisions
- Use the student's actual data when personalizing responses
- Be professional but warm in all student communications
- Flag edge cases for human review rather than guessing
```

---

## Policy Document (data/policy.txt)

A fake but realistic university policy covering:
- Application deadlines (Fall: May 1, Spring: Nov 1)
- Missing document rules (14-day grace period)
- Financial aid eligibility thresholds
- Deferral request process (30 days before term)
- Email tone guidelines (professional, supportive)
- Escalation triggers (complex financial cases, appeals)

---

## Build Schedule

| Hour | Task |
|---|---|
| 0:00–1:00 | Scaffold Next.js app, install deps, set up env, create shared lib files |
| 1:00–2:30 | Module 1 — Admissions Automation (agent + UI) |
| 2:30–4:00 | Module 2 — Student Services Chat (agent + UI) |
| 4:00–5:30 | Module 3 — Cross-Dept Handoff pipeline (agent + UI) |
| 5:30–6:30 | Wire all real integrations (Sheets, Gmail, Slack) |
| 6:30–7:30 | Polish UI, cohesive design across all tabs |
| 7:30–8:00 | README, test full demo flow end to end |

---

## Credentials & Setup Checklist

- [ ] Google AI Studio API key → `GEMINI_API_KEY`
- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Gmail API enabled
- [ ] Service account created + JSON key downloaded
- [ ] Google Sheet created with sample applicant data
- [ ] Slack workspace created + incoming webhook URL
- [ ] All keys added to `.env.local`
- [ ] Vercel account connected to GitHub repo

---

## The Demo Script (5 Minutes)

**Minute 1 — Admissions tab**
> "Here's our applicant dashboard. It's pulling live from Google Sheets."
> Type: *"Process all pending applications"*
> Watch: Agent reads sheet → sends 3 real emails → updates statuses → Slack fires

**Minute 2 — Student Services tab**
> "Now here's the student-facing side."
> Type: *"Am I eligible for financial aid? My name is James Okafor"*
> Watch: Agent looks up James → reads FAFSA → gives policy-accurate answer in seconds

**Minute 3 — Cross-Dept tab**
> "This is the one that replaces the most manual work."
> Type: *"Maria Lopez just accepted her offer"*
> Watch: 5-step pipeline lights up — Financial Aid → Housing → Orientation → Welcome email

**Minutes 4–5 — README conversation**
> Walk through the architecture decisions and what you'd build next:
> multi-tenant configs per institution, webhook triggers, Salesforce connector

---

## What to Build Next (README closer)

> In the next 30 days I would add:
> 1. **Multi-tenant config** — each institution has its own policy doc, sheet, and Slack workspace stored in Postgres
> 2. **Webhook triggers** — replace manual prompts with automatic triggers (new row in sheet = agent fires)
> 3. **Salesforce connector** — replace Google Sheets with real CRM for enterprise customers
> 4. **Audit log** — every agent action logged with reasoning for compliance

---

## Why This Project

Trelium's pitch is: *"Your team describes the workflow. Agents run it."*

This project builds exactly that — for their exact target market — using real integrations, real AI reasoning, and a UI that makes the agent's work visible in real time.

It is not a toy. It is a prototype of their product.

---

*Built for Trelium Founding Engineer application — April 2026*