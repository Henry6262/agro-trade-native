#!/usr/bin/env node

/**
 * Backend rule enforcement script.
 * Verifies that each NestJS domain module has matching controllers/services/DTO folders
 * and that the Prisma schema is present.
 */

import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const BACKEND_ROOT = path.join(REPO_ROOT, "backend");
const SRC_DIR = path.join(BACKEND_ROOT, "src");
const PRISMA_SCHEMA = path.join(BACKEND_ROOT, "prisma/schema.prisma");

const DOMAIN_MODULES = new Set([
  "auth",
  "buyer",
  "inspections",
  "market-data",
  "negotiations",
  "notifications",
  "onboarding",
  "pricing",
  "products",
  "regions",
  "seller",
  "simulation",
  "trade-operations",
  "transport",
  "transport-company",
]);

const issues = [];
const warnings = [];

if (!fs.existsSync(BACKEND_ROOT)) {
  console.log("Backend directory not found; skipping backend rule checks.");
  process.exit(0);
}

if (!fs.existsSync(SRC_DIR)) {
  console.log("backend/src not found; skipping backend rule checks.");
  process.exit(0);
}

function findFilesRecursively(dirPath, predicate) {
  const results = [];
  const stack = [dirPath];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.forEach((entry) => {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && predicate(entryPath)) {
        results.push(entryPath);
      }
    });
  }
  return results;
}

function enforceModule(dirEntry) {
  const moduleDir = path.join(SRC_DIR, dirEntry.name);
  const moduleFile = path.join(moduleDir, `${dirEntry.name}.module.ts`);
  if (!fs.existsSync(moduleFile)) {
    return; // treat directories without matching module file as helpers (common, utils, etc.)
  }

  const services = findFilesRecursively(moduleDir, (filePath) => filePath.endsWith(".service.ts"));
  if (!services.length) {
    issues.push(`Module '${dirEntry.name}' is missing a *.service.ts implementation.`);
  }

  if (DOMAIN_MODULES.has(dirEntry.name)) {
    const controllers = findFilesRecursively(moduleDir, (filePath) => filePath.endsWith(".controller.ts"));
    if (!controllers.length) {
      warnings.push(`Module '${dirEntry.name}' should expose controllers but none were found.`);
    }
    const dtoDir = path.join(moduleDir, "dto");
    if (controllers.length && (!fs.existsSync(dtoDir) || !fs.statSync(dtoDir).isDirectory())) {
      warnings.push(`Module '${dirEntry.name}' exposes controllers but has no dto/ directory.`);
    }
  }
}

fs.readdirSync(SRC_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .forEach(enforceModule);

if (!fs.existsSync(PRISMA_SCHEMA)) {
  issues.push("Missing prisma/schema.prisma (database schema).");
} else {
  const schemaContent = fs.readFileSync(PRISMA_SCHEMA, "utf8").trim();
  if (!schemaContent) {
    issues.push("prisma/schema.prisma is empty.");
  }
}

if (issues.length) {
  console.error("Backend rule violations detected:");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
} else {
  if (warnings.length) {
    console.warn("Backend rule checks passed with warnings:");
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  } else {
    console.log("Backend rule checks passed.");
  }
}
