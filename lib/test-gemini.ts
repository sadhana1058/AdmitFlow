// lib/test-gemini.ts
import { runAgent } from "./gemini";

runAgent("Process all pending applications", "admissions", (step) => {
  console.log(`[${step.type}] ${step.label}`, step.detail ?? "");
}).then((final) => {
  console.log("\n--- FINAL ---\n", final);
});