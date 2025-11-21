#!/usr/bin/env node

/**
 * Frontend rule enforcement script.
 * Ensures Page → Section → Feature folders contain required files and checks line limits.
 */

import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const FRONTEND_ROOT = path.join(REPO_ROOT, "front-end");
const PAGES_DIR = path.join(FRONTEND_ROOT, "src/pages");

const REQUIRED_FEATURE_ITEMS = [
  { name: "components", type: "dir" },
  { name: "hooks", type: "dir" },
  { name: "service.ts", type: "file" },
  { name: "types.ts", type: "file" },
  { name: "index.tsx", type: "file" },
];

const FILE_LIMITS = [
  {
    match: (relativePath) => relativePath.includes("/components/") && relativePath.endsWith(".tsx"),
    limit: 650,
    label: "Component",
  },
  {
    match: (relativePath) => relativePath.includes("/hooks/") && /\.[tj]sx?$/.test(relativePath),
    limit: 200,
    label: "Hook",
  },
  {
    match: (relativePath) => relativePath.endsWith("/service.ts"),
    limit: 200,
    label: "Service",
  },
  {
    match: (relativePath) => relativePath.endsWith("/store.ts"),
    limit: 100,
    label: "Store",
  },
  {
    match: (relativePath) => relativePath.endsWith("/utils.ts"),
    limit: 150,
    label: "Utils",
  },
];

const issues = [];

if (!fs.existsSync(FRONTEND_ROOT)) {
  console.log("Frontend directory not found; skipping frontend rule checks.");
  process.exit(0);
}

if (!fs.existsSync(PAGES_DIR)) {
  console.log("`front-end/src/pages` not found; skipping frontend rule checks.");
  process.exit(0);
}

function listDirectories(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function verifyFeature(featureDir, relativePath) {
  REQUIRED_FEATURE_ITEMS.forEach((item) => {
    const targetPath = path.join(featureDir, item.name);
    if (item.type === "dir") {
      if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
        issues.push(`Missing ${item.name}/ in feature ${relativePath}`);
      }
    } else if (item.type === "file") {
      if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
        issues.push(`Missing ${item.name} in feature ${relativePath}`);
      }
    }
  });
}

function walkForFeatures(currentDir, relativePath = "src/pages") {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  entries.forEach((entry) => {
    if (!entry.isDirectory()) {
      return;
    }
    if (entry.name === "features") {
      const featuresDir = path.join(currentDir, entry.name);
      listDirectories(featuresDir).forEach((featureName) => {
        const featureDir = path.join(featuresDir, featureName);
        if (featureName === "shared") {
          listDirectories(featureDir).forEach((sharedFeatureName) => {
            const sharedDir = path.join(featureDir, sharedFeatureName);
            const sharedRelPath = path.relative(PAGES_DIR, sharedDir);
            verifyFeature(sharedDir, sharedRelPath);
            checkFileLimits(sharedDir, sharedRelPath);
          });
          return;
        }
        const featureRelPath = path.relative(PAGES_DIR, featureDir);
        verifyFeature(featureDir, featureRelPath);
        checkFileLimits(featureDir, featureRelPath);
      });
    }
    walkForFeatures(path.join(currentDir, entry.name), path.join(relativePath, entry.name));
  });
}

function checkFileLimits(featureDir, featureRelPath) {
  const stack = [featureDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.forEach((entry) => {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        return;
      }
      if (!entry.isFile()) {
        return;
      }
      const relPath = path.relative(FRONTEND_ROOT, entryPath);
      const match = FILE_LIMITS.find((rule) => rule.match(relPath));
      if (!match) {
        return;
      }
      const content = fs.readFileSync(entryPath, "utf8");
      const lineCount = content.split(/\r?\n/).length;
      if (lineCount > match.limit) {
        issues.push(
          `${match.label} file exceeds ${match.limit} lines (${lineCount}): ${relPath}`
        );
      }
    });
  }
}

walkForFeatures(PAGES_DIR);

if (issues.length) {
  console.error("Frontend rule violations detected:");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
} else {
  console.log("Frontend rule checks passed.");
}
