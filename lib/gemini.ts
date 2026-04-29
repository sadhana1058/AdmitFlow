import { GoogleGenAI, type Content } from "@google/genai";
import fs from "fs";
import path from "path";
import { toolDeclarations, executeTool } from "./tools";

// ─── Client ───────────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─── Policy Doc ───────────────────────────────────────────────────────────────

function loadPolicy(): string {
  const p = path.join(process.cwd(), "data", "policy.txt");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "";
}

// ─── Module System Prompts ────────────────────────────────────────────────────

const MODULE_PROMPTS: Record<string, string> = {
  admissions: `You are AdmitFlow's Admissions Automation agent for Riverside University.
Your job is to process applicant records and take action on each one:
- Send personalised emails to applicants based on their status
- Update the sheet after every action
- Notify Slack when a batch completes or when a case is flagged
Work through every applicant systematically. Be decisive — don't ask clarifying questions, just act.`,

  "student-services": `You are AdmitFlow's Student Services agent for Riverside University.
You answer student questions using the policy document below and their personal record from the sheet.
- Look up the student first before answering
- Ground every answer in the policy doc
- If the case requires human judgment (deferral requests, disputes, special circumstances), escalate to an advisor via Slack
- Keep responses clear and empathetic`,

  handoffs: `You are AdmitFlow's Cross-Department Handoff agent for Riverside University.
When a student accepts their offer, you coordinate across departments in this exact order:
1. update_status → mark Accepted in sheet
2. send_email → financial aid package details
3. update_status → confirm housing application opened
4. update_status → confirm orientation registered
5. send_email → full welcome email with next steps
Do not skip steps. Do not run steps in parallel. Complete each one before moving to the next.`,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentStep = {
  type: "thinking" | "tool_call" | "tool_result" | "done" | "error";
  label: string;
  detail?: string;
};

export type StepCallback = (step: AgentStep) => void;

// ─── Main Agent Runner ────────────────────────────────────────────────────────

export async function runAgent(
  prompt: string,
  module: string,
  onStep: StepCallback
): Promise<string> {
  const policy = loadPolicy();
  const modulePrompt = MODULE_PROMPTS[module] ?? MODULE_PROMPTS["admissions"];

  const systemInstruction = `${modulePrompt}

---
RIVERSIDE UNIVERSITY POLICY DOCUMENT:
${policy}
---

Always use the available tools to take real actions. Never fabricate data.`;

  const history: Content[] = [
    { role: "user", parts: [{ text: prompt }] },
  ];

  let finalText = "";
  let iterations = 0;
  const MAX_ITERATIONS = 20; // safety ceiling

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.2,
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      onStep({ type: "error", label: "No response from Gemini" });
      break;
    }

    const parts = candidate.content?.parts ?? [];
    const toolCallParts = parts.filter((p) => p.functionCall);
    const textParts = parts.filter((p) => p.text);

    // Collect any text
    for (const p of textParts) {
      if (p.text) finalText += p.text;
    }

    // If no tool calls, we're done
    if (toolCallParts.length === 0) {
      onStep({ type: "done", label: "Agent complete", detail: finalText });
      break;
    }

    // Add assistant turn to history
    history.push({ role: "model", parts });

    // Execute each tool call and collect results
    const toolResultParts: Content["parts"] = [];

    for (const part of toolCallParts) {
      const call = part.functionCall!;
      const toolName = call.name ?? "";
      const toolArgs = (call.args ?? {}) as Record<string, string>;

      onStep({
        type: "tool_call",
        label: toolName,
        detail: JSON.stringify(toolArgs),
      });

      let result: string;
      try {
        result = await executeTool(toolName, toolArgs);
      } catch (err) {
        result = `Error: ${err instanceof Error ? err.message : String(err)}`;
        onStep({ type: "error", label: toolName, detail: result });
      }

      onStep({ type: "tool_result", label: toolName, detail: result });

      toolResultParts.push({
        functionResponse: {
          name: toolName,
          response: { result },
        },
      });
    }

    // Add tool results back into history for next turn
    history.push({ role: "user", parts: toolResultParts });
  }

  if (iterations >= MAX_ITERATIONS) {
    onStep({ type: "error", label: "Max iterations reached" });
  }

  return finalText;
}