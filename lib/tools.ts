import { Type } from "@google/genai";
import { readApplicants, updateStatus } from "./sheets";
import { sendEmail } from "./gmail";
import { notifySlack } from "./slack";

// ─── Tool Declarations (Gemini function calling schema) ───────────────────────

export const toolDeclarations = [
  {
    name: "read_applicants",
    description:
      "Read all applicant rows from the Google Sheet. Returns name, email, status, missing docs, GPA, FAFSA EFC, last action, and timestamp for every applicant.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "lookup_student",
    description:
      "Look up a single student by name or email. Returns their full record from the sheet.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        identifier: {
          type: Type.STRING,
          description: "The student's full name or email address.",
        },
      },
      required: ["identifier"],
    },
  },
  {
    name: "send_email",
    description:
      "Send an email to a student or staff member via Gmail. Use for status updates, missing document requests, offer letters, and welcome messages.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: {
          type: Type.STRING,
          description: "Recipient email address.",
        },
        subject: {
          type: Type.STRING,
          description: "Email subject line.",
        },
        body: {
          type: Type.STRING,
          description:
            "Full email body. Plain text. Should be professional and match the university tone guidelines.",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "update_status",
    description:
      "Update an applicant's status and/or last action notes in the Google Sheet.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        applicantName: {
          type: Type.STRING,
          description: "Full name of the applicant as it appears in the sheet.",
        },
        status: {
          type: Type.STRING,
          description:
            "New status value. One of: Complete, Missing Docs, In Review, Flagged, Accepted, Deferred.",
        },
        notes: {
          type: Type.STRING,
          description:
            "Short note describing the action taken. Written to the Last Action column.",
        },
      },
      required: ["applicantName", "status", "notes"],
    },
  },
  {
    name: "notify_slack",
    description:
      "Post a message to the admissions Slack channel. Use for escalations, completions, and urgent flags.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: {
          type: Type.STRING,
          description: "The message to post to Slack.",
        },
        urgency: {
          type: Type.STRING,
          description:
            "Urgency level: low, normal, or high. High adds an @here mention.",
        },
      },
      required: ["message", "urgency"],
    },
  },
  {
    name: "escalate_to_advisor",
    description:
      "Escalate a student case to an academic advisor by firing a high-priority Slack alert with the student name and reason.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: {
          type: Type.STRING,
          description: "Full name of the student being escalated.",
        },
        reason: {
          type: Type.STRING,
          description:
            "Why this case needs advisor review. Be specific — this goes directly into the Slack alert.",
        },
      },
      required: ["studentName", "reason"],
    },
  },
];

// ─── Tool Executor ─────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, string>
): Promise<string> {
  console.log(`[tool] ${name}`, args);

  switch (name) {
    case "read_applicants": {
      const rows = await readApplicants();
      return JSON.stringify(rows);
    }

    case "lookup_student": {
      const rows = await readApplicants();
      const id = args.identifier.toLowerCase();
      const match = rows.find(
        (r) =>
          r.name?.toLowerCase() === id || r.email?.toLowerCase() === id
      );
      if (!match) return `No student found matching "${args.identifier}".`;
      return JSON.stringify(match);
    }

    case "send_email": {
      await sendEmail(args.to, args.subject, args.body);
      return `Email sent to ${args.to}.`;
    }

    case "update_status": {
      await updateStatus(args.applicantName, args.status, args.notes);
      return `Status updated for ${args.applicantName}: ${args.status}.`;
    }

    case "notify_slack": {
      await notifySlack(args.message, args.urgency);
      return `Slack message posted (urgency: ${args.urgency}).`;
    }

    case "escalate_to_advisor": {
      const msg = `🚨 *Advisor Escalation* — *${args.studentName}*\n${args.reason}`;
      await notifySlack(msg, "high");
      return `Escalation posted to Slack for ${args.studentName}.`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}