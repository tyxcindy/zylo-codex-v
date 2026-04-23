import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const now = new Date().toISOString();

const HIGH_PRIORITY_ROTATION_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "UNSPLASH_ACCESS_KEY",
  "UNSPLASH_SECRET_KEY",
  "RESEND_API_KEY"
];

const PUBLIC_OR_LOW_SENSITIVITY_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL"
];

function readFileIfExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return fs.existsSync(absolutePath)
    ? fs.readFileSync(absolutePath, "utf8")
    : undefined;
}

function parseEnvKeys(fileContents) {
  if (!fileContents) {
    return [];
  }

  return fileContents
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1])
    .filter(Boolean);
}

function readProjectLink() {
  const projectJson = readFileIfExists(".vercel/project.json");

  if (!projectJson) {
    return undefined;
  }

  try {
    return JSON.parse(projectJson);
  } catch {
    return undefined;
  }
}

function hasIgnoreEntry(fileContents, entry) {
  return Boolean(
    fileContents
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .includes(entry)
  );
}

function printSection(title, lines) {
  console.log(`\n${title}`);
  for (const line of lines) {
    console.log(`- ${line}`);
  }
}

const envExampleKeys = new Set(parseEnvKeys(readFileIfExists(".env.example")));
const envLocalKeys = parseEnvKeys(readFileIfExists(".env.local"));
const envLocalKeySet = new Set(envLocalKeys);
const projectLink = readProjectLink();
const gitignore = readFileIfExists(".gitignore");
const vercelignore = readFileIfExists(".vercelignore");

const presentHighPriorityKeys = HIGH_PRIORITY_ROTATION_KEYS.filter((key) =>
  envLocalKeySet.has(key)
);
const presentPublicKeys = PUBLIC_OR_LOW_SENSITIVITY_KEYS.filter((key) =>
  envLocalKeySet.has(key)
);
const missingFromLocal = [...envExampleKeys].filter((key) => !envLocalKeySet.has(key));
const unexpectedLocalKeys = envLocalKeys.filter((key) => !envExampleKeys.has(key));

console.log("Zylo Vercel Incident Audit");
console.log(`Generated: ${now}`);

if (projectLink) {
  printSection("Linked Vercel project", [
    `projectName=${projectLink.projectName ?? "unknown"}`,
    `projectId=${projectLink.projectId ?? "unknown"}`,
    `orgId=${projectLink.orgId ?? "unknown"}`
  ]);
} else {
  printSection("Linked Vercel project", ["No .vercel/project.json link found in this workspace"]);
}

printSection("Rotate first", presentHighPriorityKeys.length
  ? presentHighPriorityKeys.map(
      (key) => `${key} is present locally and should be rotated immediately in Vercel and the upstream provider`
    )
  : ["No high-priority server secrets were detected in .env.local"]);

printSection("Review but do not panic-rotate first", presentPublicKeys.length
  ? presentPublicKeys.map((key) => `${key} is present locally; review scope, but it is not the first rotation priority`)
  : ["No public or lower-sensitivity variables were detected in .env.local"]);

if (missingFromLocal.length) {
  printSection("Missing from .env.local", missingFromLocal.map((key) => key));
}

if (unexpectedLocalKeys.length) {
  printSection("Unexpected local env keys", unexpectedLocalKeys.map((key) => key));
}

printSection("Repo guardrails", [
  `.gitignore protects .env.local: ${hasIgnoreEntry(gitignore, ".env.local") ? "yes" : "no"}`,
  `.gitignore protects .vercel: ${hasIgnoreEntry(gitignore, ".vercel") ? "yes" : "no"}`,
  `.vercelignore exists: ${vercelignore ? "yes" : "no"}`,
  `.vercelignore blocks .env.*: ${hasIgnoreEntry(vercelignore, ".env.*") ? "yes" : "no"}`
]);

printSection("Manual follow-up", [
  "In Vercel Dashboard: mark every server-side secret as Sensitive Variable",
  "In Vercel CLI: run `vercel activity ls --all --since 30d` and review unexpected env/project/deployment events",
  "In Vercel CLI: run `vercel env ls production`, `vercel env ls preview`, and `vercel env ls development`",
  "In Vercel Dashboard: review recent deployments and delete anything unexpected",
  "In Google Admin or Google Account security: check for OAuth app `110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com` and revoke it if present",
  "Enable Vercel 2FA and rotate any Deployment Protection bypass tokens"
]);
