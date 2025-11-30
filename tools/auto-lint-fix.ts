// tools/auto-lint-fix.ts
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const REPO_ROOT = process.cwd();
const LINT_FILE = path.join(REPO_ROOT, "lint-errors.txt");

// This is the "vibe" – tailored for your project + auto-apply format.
const SYSTEM_PROMPT = `
You are a senior TypeScript / React / Firebase engineer working on a large PWA codebase.

Context:
- Repo root: /home/user/purpose-path-boost
- Tech: React + Vite + TypeScript, Firebase (Firestore/Auth/Storage), Node 20.
- AI: Google Gemini is used only to generate file contents; it does not run in the app.
- Supabase has been fully removed; do NOT reintroduce Supabase.

You will be called with:
- A lint report (lint-errors.txt) containing ESLint errors/warnings for this repo.
- The FULL contents of some source files referenced by that report.

Your task on each call:
- Read lint-errors.txt and the provided file contents.
- For the files you are given, fix ALL lint errors mentioned for those files in the current lint-errors.txt slice.
- Return UPDATED FULL FILE CONTENTS for those files in a strict, machine-friendly format so a script can write them directly to disk.

Fixes priority for the given files:
1) Parsing / syntax errors (e.g. "Parsing error: '{' expected" in BlogEditor.tsx, vite.config.ts).
2) Structural rules: no-case-declarations, no-empty-object-type, no-empty, no-constant-binary-expression.
3) Type safety: remove @typescript-eslint/no-explicit-any.
4) React hooks: react-hooks/exhaustive-deps.
5) React fast-refresh warnings: react-refresh/only-export-components (lowest priority; only after errors).

Convergence rules:
- Do NOT reintroduce any where it has been removed.
- Do NOT reintroduce patterns that would obviously re-trigger the same lint errors.
- For every file you output, you MUST fix ALL lint errors listed for that file in the provided lint-errors.txt slice.

OUTPUT FORMAT (STRICT):
1) Start with a short human-readable summary (2–6 bullet points).
2) Then, for each file you modify, output:

   === FILE: relative/path/from/repo/root ===
   [full updated file contents, EXACTLY as it should appear on disk]

   - Use the literal marker line "=== FILE: path ===".
   - Do NOT wrap file contents in Markdown code fences.
   - Do NOT put commentary inside file contents.
   - Only include files you actually changed.

3) After all files, end with:

   === NEXT STEPS ===
   - A short checklist for the developer (e.g. run lint again).

Do not output anything outside this structure.
`.trim();

/**
 * Run eslint and capture output to lint-errors.txt (non-fatal on failure).
 */
function runLint() {
  console.log("▶️ Running eslint to generate lint-errors.txt...");
  try {
    execSync("npm run lint > lint-errors.txt || true", {
      cwd: REPO_ROOT,
      stdio: "inherit",
      shell: "/bin/bash",
    });
  } catch {
    // non-zero exit is expected when lint fails
  }
}

/**
 * Parse lint-errors.txt and return:
 * - full report text
 * - number of problems from the "✖ N problems (M errors, K warnings)" line (if present)
 */
function readLintReport(): { text: string; problems: number | null } {
  if (!fs.existsSync(LINT_FILE)) {
    return { text: "", problems: null };
  }

  const raw = fs.readFileSync(LINT_FILE, "utf8");
  let problems: number | null = null;

  for (const line of raw.split("\n")) {
    const m = line.match(/^✖\s+(\d+)\s+problems/);
    if (m) {
      problems = parseInt(m[1], 10);
      break;
    }
  }

  return { text: raw, problems };
}

/**
 * Parse lint-errors.txt to find file paths.
 * We support both absolute and relative paths.
 */
function getFilesFromLint(maxFiles: number): string[] {
  if (!fs.existsSync(LINT_FILE)) return [];
  const raw = fs.readFileSync(LINT_FILE, "utf8");

  const lines = raw.split("\n");
  const fileSet = new Set<string>();

  for (const line of lines) {
    // Absolute path like: /home/user/purpose-path-boost/src/...
    let match = line.match(/\/home\/user\/purpose-path-boost\/(.+\.(ts|tsx|d\.ts))/);
    if (!match) {
      // Relative path like: src/...
      match = line.match(/^(src\/.+\.(ts|tsx|d\.ts)|tools\/.+\.(ts|tsx))/);
    }

    if (match) {
      const relPath = match[1].trim();
      fileSet.add(relPath);
      if (fileSet.size >= maxFiles) break;
    }
  }

  return Array.from(fileSet);
}

/**
 * Build the user prompt with lint slice + current file contents.
 */
function buildUserPrompt(lintSlice: string, files: string[]): string {
  let prompt = "";
  prompt += "Here is the current lint-errors.txt (top slice):\n\n";
  prompt += lintSlice.trim() + "\n\n";
  prompt += "Fix ALL lint issues for the following files based on this report. Here are their current contents:\n\n";

  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    prompt += `=== FILE: ${rel} (CURRENT) ===\n`;
    prompt += content;
    if (!content.endsWith("\n")) prompt += "\n";
    prompt += "\n\n";
  }

  return prompt.trim();
}

/**
 * Parse Gemini's response and write updated files.
 */
function applyGeminiResponse(responseText: string) {
  const lines = responseText.split("\n");

  let currentFile: string | null = null;
  let currentBuffer: string[] = [];
  const filesToWrite: { path: string; content: string }[] = [];

  for (const line of lines) {
    const fileHeaderMatch = line.match(/^=== FILE:\s+(.+)\s*===\s*$/);
    const nextStepsMatch = line.match(/^=== NEXT STEPS ===/);

    if (fileHeaderMatch) {
      if (currentFile) {
        filesToWrite.push({
          path: currentFile,
          content: currentBuffer.join("\n").replace(/\s+$/, "") + "\n",
        });
      }
      currentFile = fileHeaderMatch[1].trim();
      currentBuffer = [];
    } else if (nextStepsMatch) {
      if (currentFile) {
        filesToWrite.push({
          path: currentFile,
          content: currentBuffer.join("\n").replace(/\s+$/, "") + "\n",
        });
      }
      currentFile = null;
      currentBuffer = [];
      break;
    } else if (currentFile) {
      currentBuffer.push(line);
    }
  }

  if (currentFile) {
    filesToWrite.push({
      path: currentFile,
      content: currentBuffer.join("\n").replace(/\s+$/, "") + "\n",
    });
  }

  if (filesToWrite.length === 0) {
    console.warn("⚠️ Gemini response did not contain any === FILE: ... === sections.");
    return;
  }

  console.log("💾 Applying Gemini changes to files:");
  for (const file of filesToWrite) {
    const abs = path.join(REPO_ROOT, file.path);
    console.log("  -", file.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, file.content, "utf8");
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const genAI = new GoogleGenAI({ apiKey });
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const MAX_ITERATIONS = 5;
  const MAX_CHARS = 20000;
  const MAX_FILES_PER_ITER = 10;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    console.log(`\n==============================`);
    console.log(`🔁 Gemini lint autofix iteration ${iteration}/${MAX_ITERATIONS}`);
    console.log(`==============================\n`);

    // 1) Run lint and read report
    runLint();
    const { text: lintText, problems } = readLintReport();

    if (!lintText.trim()) {
      console.log("✅ lint-errors.txt is empty. No lint errors.");
      break;
    }

    if (problems !== null) {
      console.log(`📊 Current lint problems: ${problems}`);
      if (problems === 0) {
        console.log("✅ No remaining problems. Stopping.");
        break;
      }
    }

    // 2) Select a slice and files for this iteration
    const lintSlice =
      lintText.length > MAX_CHARS
        ? lintText.slice(0, MAX_CHARS) + "\n\n[... truncated ...]"
        : lintText;

    const files = getFilesFromLint(MAX_FILES_PER_ITER);
    if (files.length === 0) {
      console.log("⚠️ No files found in lint-errors.txt to process. Stopping.");
      break;
    }

    console.log("🧾 Files to fix in this iteration:");
    files.forEach((f) => console.log("  -", f));

    const userPrompt = buildUserPrompt(lintSlice, files);

    console.log("🤖 Calling Gemini for fixes...");
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
    });

    const text = result.response.text().trim();
    if (!text) {
      console.error("❌ Gemini returned an empty response. Stopping.");
      break;
    }

    applyGeminiResponse(text);

    console.log("\n✅ Gemini fixes applied for this iteration.");
    console.log("Re-running lint in the next iteration (if any).");
  }

  console.log("\n🎯 Done. Now run: npm run lint > lint-errors.txt || true");
  console.log("Then inspect lint-errors.txt to see remaining issues.");
}

main().catch((err) => {
  console.error("❌ gemini-lint-autofix failed:", err);
  process.exit(1);
});

