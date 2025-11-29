// tools/auto-lint-fix.ts
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `
You are a senior TypeScript/React engineer working on a large PWA.

You are given:
- lint-errors.txt (ESLint output)
- The user already has all source files locally in a git repo.

Your job in each call:
- Read lint-errors.txt carefully.
- Infer the minimal code changes needed to fix as many reported issues as possible in a single pass.
- Output a SINGLE unified diff patch that can be applied with \`git apply\` from the repository root.

Important constraints:
- The patch MUST be valid unified diff format:
  - Start each file with: "diff --git a/… b/…"
  - Then "index …" (you may use placeholders like "index 0000000..1111111")
  - Then:
    - "--- a/path/to/file"
    - "+++ b/path/to/file"
    - "@@ … @@"
  - Then the +/- lines.
- All file paths in the diff must be relative to the repo root, matching the paths shown in lint-errors.txt.

Lint behavior:
- Treat lint-errors.txt as the source of truth.
- Do NOT introduce new obvious lint errors.
- Fix parsing/syntax errors first, then structural issues, then no-explicit-any, hook deps, etc.
- Make idiomatic TypeScript / React / Node 20 code.
- Do NOT reintroduce previously rejected patterns.

Output format:
- Output ONLY the diff. No explanations, no markdown fences, no prose.
- The entire response should be directly saveable as a .patch file and usable with: \`git apply <file.patch>\`.

Assumptions:
- If you lack full context for certain errors, fix what you can from the report and existing patterns.
- Prefer small, safe refactors over large reorganizations.
`.trim();

async function main() {
  const repoRoot = process.cwd();
  const lintFilePath = path.join(repoRoot, "lint-errors.txt");

  console.log("▶️ Running ESLint and capturing output to lint-errors.txt...");
  try {
    execSync("npm run lint > lint-errors.txt || true", {
      cwd: repoRoot,
      stdio: "inherit",
      shell: "/bin/bash",
    });
  } catch {
    // non-zero exit is expected when lint fails
  }

  if (!fs.existsSync(lintFilePath)) {
    console.error("❌ lint-errors.txt not found.");
    process.exit(1);
  }

  const lintReportRaw = fs.readFileSync(lintFilePath, "utf8");
  const lintReport = lintReportRaw.trim();

  if (!lintReport) {
    console.log("✅ No lint errors. lint-errors.txt is empty.");
    process.exit(0);
  }

  const MAX_CHARS = 15000;
  const lintForGemini =
    lintReport.length > MAX_CHARS
      ? lintReport.slice(0, MAX_CHARS) +
        "\n\n[... truncated lint report, fix from top down in this chunk ...]"
      : lintReport;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY env var is not set.");
    process.exit(1);
  }

  console.log("🤖 Calling Gemini to generate patch...");
  const genAI = new GoogleGenAI({ apiKey });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash", // or "gemini-2.0-pro"
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "Here is lint-errors.txt:\n\n" +
              lintForGemini +
              "\n\nGenerate a single unified diff patch that fixes as many of these issues as possible in one pass. Remember: output ONLY the diff.",
          },
        ],
      },
    ],
  });

  const text = result.response.text().trim();
  if (!text) {
    console.error("❌ Gemini returned an empty response.");
    process.exit(1);
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const patchName = `gemini-lint-fix-${timestamp}.patch`;
  const patchPath = path.join(repoRoot, patchName);

  fs.writeFileSync(patchPath, text, "utf8");

  console.log(`�� Wrote patch to ${patchPath}`);
  console.log("📦 Applying patch with git apply...");

  try {
    execSync(`git apply "${patchName}"`, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: "/bin/bash",
    });
    console.log("✅ Patch applied.");
  } catch (err) {
    console.error("❌ Failed to apply patch. Check the patch file and your working tree.");
    process.exit(1);
  }

  console.log("");
  console.log("Next steps:");
  console.log("  1) Inspect changes: git status && git diff");
  console.log("  2) Re-run lint:      npm run lint > lint-errors.txt || true");
  console.log("  3) Run again:        npm run lint:auto-fix (until lint-errors.txt is empty)");
}

main().catch((err) => {
  console.error("❌ auto-lint-fix failed:", err);
  process.exit(1);
});

