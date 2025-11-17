#!/usr/bin/env node

/**
 * Agro-Trade Control CLI (atctl)
 * Lightweight helper for session bootstrapping, status checks, and doc references.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const TODAY = new Date().toISOString().slice(0, 10);
const DOCS = [
  { label: "Handbook", path: "docs/HANDBOOK.md" },
  { label: "Session Runbook", path: "docs/runbooks/session-start.md" },
  { label: "Code Standards", path: "docs/standards/code-quality.md" },
  { label: "Backend Guide", path: "docs/handbook/projects/backend.md" },
  { label: "Admin Dashboard Guide", path: "docs/handbook/projects/admin-dashboard.md" },
  { label: "Mobile Guide", path: "docs/handbook/projects/mobile.md" },
  { label: "Workflow Initiative", path: "docs/coordination/automated-workflow-initiative.md" },
];

const PROJECTS = [
  {
    name: "backend",
    path: "backend/",
    recommendations: [
      "cd backend && npm run lint",
      "cd backend && npm run test",
      "cd backend && npm run test:e2e",
    ],
  },
  {
    name: "admin-dashboard",
    path: "admin-dashboard/",
    recommendations: [
      "cd admin-dashboard && npm run lint",
      "cd admin-dashboard && npm run test",
      "cd admin-dashboard && npm run build",
    ],
  },
  {
    name: "front-end",
    path: "front-end/",
    recommendations: [
      "cd front-end && npm run lint",
      "cd front-end && npm run test",
      "cd front-end && npm run start",
    ],
  },
  {
    name: "docs",
    path: "docs/",
    recommendations: [
      "node scripts/atctl.mjs docs --sync",
      "git status docs/",
    ],
  },
];

const GENERATED_ITEMS = [
  {
    type: "directory",
    title: "Backend Module Inventory",
    source: "backend/src",
    output: "docs/handbook/generated/backend-modules.md",
    description: "Lists top-level backend modules under src/",
  },
  {
    type: "directory",
    title: "Admin Dashboard Feature Inventory",
    source: "admin-dashboard/src/features",
    output: "docs/handbook/generated/admin-dashboard-features.md",
    description: "Lists feature folders powering the control tower UI",
  },
  {
    type: "directory",
    title: "Mobile App Structure",
    source: "front-end/src",
    output: "docs/handbook/generated/mobile-structure.md",
    description: "Lists top-level directories in the mobile app",
  },
  {
    type: "files",
    title: "Backend Services Map",
    source: "backend/src",
    output: "docs/handbook/generated/backend-services.md",
    description: "Lists NestJS service files (`*.service.ts`)",
    pattern: /\.service\.ts$/,
  },
  {
    type: "files",
    title: "Admin Dashboard Pages",
    source: "admin-dashboard/src/pages",
    output: "docs/handbook/generated/admin-dashboard-pages.md",
    description: "Lists route-level React pages",
    pattern: /\.tsx$/,
  },
];

const DB_SCHEMA_OUTPUT = {
  schema: "backend/prisma/schema.prisma",
  output: "docs/reference/db-schema.md",
};

const DOCS_CATALOG_JSON = "docs/coordination/docs-catalog.json";
const DOCS_STRAY_REPORT = "docs/coordination/docs-strays.md";
const IMPLEMENTATION_STATUS_FILE = "docs/coordination/implementation-status.md";

const ROOT_DOC_ALLOWLIST = new Set(["AGENTS.md", "README.md"]);
const RULES_PREFIX = "rules/";

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
      .toString()
      .trim();
  } catch (error) {
    return error.stderr?.toString().trim() || error.message;
  }
}

function printSection(title) {
  console.log(`\n== ${title} ==`);
}

function getHooksPath() {
  try {
    return execSync("git config --get core.hooksPath", {
      stdio: ["ignore", "pipe", "pipe"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function ensureHooksConfigured() {
  const hooksPath = getHooksPath();
  if (hooksPath !== "scripts/hooks/git") {
    console.log(
      "\n⚠️  Git hooks not configured for atctl. Run `bash scripts/hooks/install.sh` so pre-push checks execute automatically."
    );
  }
}

function getGitBranch() {
  return run("git rev-parse --abbrev-ref HEAD");
}

function getGitStatus() {
  const raw = run("git status -sb");
  const lines = raw.split("\n");
  return {
    header: lines[0] || "",
    entries: lines.slice(1),
  };
}

function listKeyDocs() {
  DOCS.forEach((doc) => {
    const absolute = path.join(REPO_ROOT, doc.path);
    const status = fs.existsSync(absolute) ? "✓" : "✗";
    console.log(`- [${status}] ${doc.label} -> ${doc.path}`);
  });
}

function ensureDir(dirPath) {
  if (!dirPath || dirPath === ".") {
    return;
  }
  fs.mkdirSync(path.join(REPO_ROOT, dirPath), { recursive: true });
}

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".expo",
  ".claude",
  "coverage",
]);

function getChangedFiles() {
  const porcelain = run("git status --porcelain --untracked-files=all");
  if (!porcelain) return [];
  return porcelain
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[A-Z? ]+\s+/, ""));
}

function detectProjects(files) {
  const touched = new Map();
  files.forEach((file) => {
    PROJECTS.forEach((project) => {
      if (file.startsWith(project.path)) {
        touched.set(project.name, project);
      }
    });
  });
  return Array.from(touched.values());
}

function printRecommendations(projects) {
  projects.forEach((project) => {
    console.log(`- ${project.name}`);
    project.recommendations.forEach((cmd) => {
      console.log(`    • ${cmd}`);
    });
  });
}

function suggestServices() {
  console.log("- Ensure Postgres + Redis are running locally");
  console.log("- Backend dev server: cd backend && npm run start:dev");
  console.log("- Admin dashboard: cd admin-dashboard && npm run dev");
  console.log("- Mobile (if needed): cd front-end && npm run start");
}

function sessionCommand() {
  console.log("Agro-Trade Session Overview");
  printSection("Git");
  const branch = getGitBranch();
  const status = getGitStatus();
  console.log(`Branch: ${branch}`);
  console.log(`Status: ${status.header}`);
  if (status.entries.length) {
    const preview = status.entries.slice(0, 10);
    preview.forEach((line) => console.log(`  ${line}`));
    if (status.entries.length > preview.length) {
      console.log(`  ... (+${status.entries.length - preview.length} more)`);
    }
  } else {
    console.log("  Working tree clean");
  }

  printSection("Docs to Review");
  listKeyDocs();

  printSection("Environment Reminders");
  suggestServices();

  printSection("Next Actions");
  console.log("- Review docs relevant to current work");
  console.log("- Update or create notes before coding");
  console.log("- Keep docs in sync with any code changes");
  ensureHooksConfigured();
}

function statusCommand() {
  printSection("Git Status");
  const status = getGitStatus();
  console.log(status.header);
  status.entries.forEach((line) => console.log(line));
}

function docsCommand(args) {
  if (args.includes("--sync")) {
    syncDocs();
    return;
  }

  printSection("Handbook Links");
  listKeyDocs();
  console.log("\nGenerated references:");
  GENERATED_ITEMS.forEach((item) => {
    const exists = fs.existsSync(path.join(REPO_ROOT, item.output)) ? "✓" : "✗";
    console.log(`- [${exists}] ${item.title} -> ${item.output}`);
  });
  const schemaExists = fs.existsSync(path.join(REPO_ROOT, DB_SCHEMA_OUTPUT.output)) ? "✓" : "✗";
  console.log(`- [${schemaExists}] Database Schema Summary -> ${DB_SCHEMA_OUTPUT.output}`);
  console.log("\nRun `node scripts/atctl.mjs docs --sync` whenever structure/schema changes.");
  const strayExists = fs.existsSync(path.join(REPO_ROOT, DOCS_STRAY_REPORT)) ? "✓" : "✗";
  console.log(`\nStray doc report: [${strayExists}] ${DOCS_STRAY_REPORT}`);
}

function checkCommand(args) {
  const files = getChangedFiles();
  printSection("Changed Files");
  if (!files.length) {
    console.log("Working tree clean. Run lint/tests before pushing anyway.");
  } else {
    files.slice(0, 20).forEach((file) => console.log(`- ${file}`));
    if (files.length > 20) {
      console.log(`... (+${files.length - 20} more)`);
    }
  }

  const touchedProjects = detectProjects(files);
  printSection("Recommended Commands");
  if (!touchedProjects.length) {
    console.log("No tracked projects detected. If you touched infra or configs, run relevant checks manually.");
  } else {
    printRecommendations(touchedProjects);
  }

  if (args.includes("--auto")) {
    runRecommendedCommands(touchedProjects);
  }

  const enforcementIssues = enforceDocDiscipline(files);
  if (enforcementIssues.length) {
    console.error("\nDoc enforcement issues:");
    enforcementIssues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
  }

  runBackendRuleCheck();
  runFrontendRuleCheck();
}

function runRecommendedCommands(projects) {
  const commands = Array.from(
    new Set(projects.flatMap((project) => project.recommendations))
  );
  if (!commands.length) {
    console.log("\nNo commands to run.");
    return;
  }
  console.log("\nRunning recommended commands...");
  let failed = false;
  commands.forEach((cmd) => {
    console.log(`\n$ ${cmd}`);
    try {
      execSync(cmd, { stdio: "inherit" });
    } catch (error) {
      failed = true;
      console.error(`Command failed: ${cmd}`);
    }
  });
  if (failed) {
    console.error("\nOne or more commands failed. Inspect logs above.");
    process.exitCode = 1;
  } else {
    console.log("\nAll commands completed.");
  }
}

function listDirectories(relativePath) {
  const abs = path.join(REPO_ROOT, relativePath);
  if (!fs.existsSync(abs)) {
    return [];
  }
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function writeFileIfChanged(relativePath, content) {
  const abs = path.join(REPO_ROOT, relativePath);
  ensureDir(path.dirname(relativePath));
  if (fs.existsSync(abs)) {
    const current = fs.readFileSync(abs, "utf8");
    if (current === content) {
      return false;
    }
  }
  fs.writeFileSync(abs, content, "utf8");
  return true;
}

function buildModuleDoc({ title, source, output, description }) {
  const dirs = listDirectories(source);
  const lines = dirs.map((dir) => `- \`${dir}/\``);
  const content = `# ${title}

_Auto-generated ${TODAY}_

Source: \`${source}\`

${description}.

${lines.length ? lines.join("\n") : "_No directories detected._"}
`;
  return writeFileIfChanged(output, content);
}

function listFilesMatching(relativePath, pattern) {
  const abs = path.join(REPO_ROOT, relativePath);
  if (!fs.existsSync(abs)) {
    return [];
  }
  const results = [];
  function walk(currentAbs, currentRel) {
    const entries = fs.readdirSync(currentAbs, { withFileTypes: true });
    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) {
          walk(path.join(currentAbs, entry.name), path.join(currentRel, entry.name));
        }
      } else if (pattern.test(entry.name)) {
        results.push(path.join(currentRel, entry.name));
      }
    });
  }
  walk(abs, "");
  return results.sort((a, b) => a.localeCompare(b));
}

function buildFileDoc({ title, source, output, description, pattern }) {
  const files = listFilesMatching(source, pattern);
  const lines = files.map((file) => `- \`${file}\``);
  const content = `# ${title}

_Auto-generated ${TODAY}_

Source: \`${source}\`

${description}.

${lines.length ? lines.join("\n") : "_No files detected._"}
`;
  return writeFileIfChanged(output, content);
}

function buildSchemaDoc() {
  const schemaPath = path.join(REPO_ROOT, DB_SCHEMA_OUTPUT.schema);
  let models = [];
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    const regex = /model\s+(\w+)\s+{/g;
    let match;
    while ((match = regex.exec(schema))) {
      models.push(match[1]);
    }
  }
  models = Array.from(new Set(models)).sort((a, b) => a.localeCompare(b));
  const lines = models.map((model) => `- \`${model}\``);
  const content = `# Database Schema Summary

_Auto-generated ${TODAY}_

Source: \`${DB_SCHEMA_OUTPUT.schema}\`

Detected Prisma models (${models.length}):

${lines.length ? lines.join("\n") : "_No models detected (check schema)."}
`;
  return writeFileIfChanged(DB_SCHEMA_OUTPUT.output, content);
}

function listMarkdownFiles() {
  const results = [];
  function walk(currentRel) {
    const abs = path.join(REPO_ROOT, currentRel || ".");
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    entries.forEach((entry) => {
      if (entry.name.startsWith(".") && entry.name !== ".env" && entry.name !== ".gitignore") {
        if (entry.name === ".git") {
          return;
        }
      }
      const relPath = currentRel ? `${currentRel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) {
          walk(relPath);
        }
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        results.push(relPath);
      }
    });
  }
  walk("");
  return results.sort((a, b) => a.localeCompare(b));
}

function classifyMarkdown(pathRelative) {
  const isDocs = pathRelative.startsWith("docs/");
  const isRules = pathRelative.startsWith(RULES_PREFIX);
  const status = isDocs
    ? pathRelative.startsWith("docs/handbook/generated/")
      ? "generated"
      : "docs"
    : isRules
    ? "rules"
    : ROOT_DOC_ALLOWLIST.has(pathRelative)
    ? "allowed-root"
    : "needs-migration";
  const area = pathRelative.includes("/") ? pathRelative.split("/")[0] : "root";
  return {
    path: pathRelative,
    area,
    status,
  };
}

function buildDocsCatalog() {
  const files = listMarkdownFiles();
  const entries = files.map(classifyMarkdown);
  const catalogChanged = writeFileIfChanged(
    DOCS_CATALOG_JSON,
    JSON.stringify(entries, null, 2)
  );

  const stray = entries.filter((entry) => entry.status === "needs-migration");
  const strayContent = `# Stray Markdown Files

_Auto-generated ${TODAY}_

Total Markdown files: ${entries.length}
Files needing migration: ${stray.length}

${stray.length ? stray.map((entry) => `- \`${entry.path}\``).join("\n") : "No strays 🎉"}
`;
  const strayChanged = writeFileIfChanged(DOCS_STRAY_REPORT, strayContent);
  const updated = [];
  if (catalogChanged) updated.push(DOCS_CATALOG_JSON);
  if (strayChanged) updated.push(DOCS_STRAY_REPORT);
  return updated;
}

function syncDocs() {
  console.log("Generating handbook references...");
  const updated = [];
  GENERATED_ITEMS.forEach((item) => {
    let changed = false;
    if (item.type === "directory") {
      changed = buildModuleDoc(item);
    } else if (item.type === "files") {
      changed = buildFileDoc(item);
    }
    if (changed) {
      updated.push(item.output);
    }
  });
  const schemaChanged = buildSchemaDoc();
  if (schemaChanged) updated.push(DB_SCHEMA_OUTPUT.output);

  const catalogChanged = buildDocsCatalog();
  updated.push(...catalogChanged);

  if (!updated.length) {
    console.log("No changes detected. Generated docs already up to date.");
  } else {
    console.log("Updated:");
    updated.forEach((file) => console.log(`- ${file}`));
  }
}

function readDocsCatalog() {
  const catalogPath = path.join(REPO_ROOT, DOCS_CATALOG_JSON);
  if (!fs.existsSync(catalogPath)) return [];
  try {
    const raw = fs.readFileSync(catalogPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Could not parse ${DOCS_CATALOG_JSON}: ${error.message}`);
    return [];
  }
}

function enforceDocDiscipline(files) {
  const issues = [];
  const catalog = readDocsCatalog();
  const stray = catalog.filter((entry) => entry.status === "needs-migration");
  if (stray.length) {
    issues.push(
      `Docs stray report is not clean (${stray.length} file(s) need migration). Run \`node scripts/atctl.mjs docs --sync\` and archive/move stray docs.`
    );
  }

  const touchesFeatureCode = files.some((file) =>
    [
      "backend/src/",
      "admin-dashboard/src/",
      "front-end/src/",
      "docs/features/",
    ].some((prefix) => file.startsWith(prefix))
  );
  const touchedStatus = files.includes(IMPLEMENTATION_STATUS_FILE);
  if (touchesFeatureCode && !touchedStatus) {
    issues.push(
      `Feature code changed without updating ${IMPLEMENTATION_STATUS_FILE}. Document story progress before pushing.`
    );
  }

  return issues;
}

function runBackendRuleCheck() {
  const scriptPath = path.join(REPO_ROOT, "scripts/check-backend-rules.mjs");
  if (!fs.existsSync(scriptPath)) {
    return;
  }
  try {
    console.log("\nRunning backend rule checks...");
    execSync(`node ${scriptPath}`, { stdio: "inherit" });
  } catch (error) {
    console.error("Backend rule checks failed.");
    process.exitCode = 1;
  }
}

function runFrontendRuleCheck() {
  const scriptPath = path.join(REPO_ROOT, "scripts/check-frontend-rules.mjs");
  if (!fs.existsSync(scriptPath)) {
    return;
  }
  try {
    console.log("\nRunning frontend rule checks...");
    execSync(`node ${scriptPath}`, { stdio: "inherit" });
  } catch (error) {
    console.error("Frontend rule checks failed.");
    process.exitCode = 1;
  }
}

function showHelp() {
  console.log("Usage: node scripts/atctl.mjs <command>");
  console.log("Commands:");
  console.log("  session       Show branch/status + key docs (use at session start)");
  console.log("  status        Compact git status");
  console.log("  docs [--sync] List handbook docs or sync generated content");
  console.log("  check [--auto] Show lint/test/doc actions, optionally run them");
  console.log("  help          Show this message");
}

const [, , command = "help", ...args] = process.argv;

switch (command) {
  case "session":
    sessionCommand();
    break;
  case "status":
    statusCommand();
    break;
  case "docs":
    docsCommand(args);
    break;
  case "check":
    checkCommand(args);
    break;
  case "help":
  default:
    showHelp();
    break;
}
