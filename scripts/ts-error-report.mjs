#!/usr/bin/env node
/**
 * TypeScript Error Report Generator
 * Parses tsc output and generates a Markdown build report.
 */
import fs from 'node:fs';
import path from 'node:path';

const REPORT_OUTPUT = 'build_report.md';
const ERROR_FILES = [
  { label: 'Backend TypeScript', path: 'ts-errors-backend.txt' },
  { label: 'Admin Dashboard Lint', path: 'lint-admin.txt' },
];

function parseTsErrors(content) {
  const lines = content.split('\n').filter(Boolean);
  const errors = [];
  const byFile = new Map();

  for (const line of lines) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
    if (match) {
      const [, file, row, col, code, message] = match;
      const entry = { file, row: +row, col: +col, code, message };
      errors.push(entry);
      if (!byFile.has(file)) byFile.set(file, []);
      byFile.get(file).push(entry);
    }
  }
  return { errors, byFile };
}

function buildMarkdown() {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const sections = [];
  let totalErrors = 0;

  sections.push(`# Build Diagnostics Report`);
  sections.push(`_Generated: ${now} UTC_\n`);

  for (const source of ERROR_FILES) {
    const absPath = path.resolve(source.path);
    if (!fs.existsSync(absPath)) {
      sections.push(`## ${source.label}\nNo output file found.\n`);
      continue;
    }
    const content = fs.readFileSync(absPath, 'utf8').trim();
    if (!content) {
      sections.push(`## ${source.label}\n**Clean** — no errors detected.\n`);
      continue;
    }

    const { errors, byFile } = parseTsErrors(content);
    totalErrors += errors.length;

    if (errors.length === 0) {
      sections.push(`## ${source.label}\nOutput present but no parseable TS errors. Raw lines: ${content.split('\n').length}\n`);
      continue;
    }

    sections.push(`## ${source.label}`);
    sections.push(`**${errors.length} errors** across ${byFile.size} files\n`);

    const topFiles = [...byFile.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10);

    sections.push('| File | Errors | Top Code |');
    sections.push('|------|--------|----------|');
    for (const [file, errs] of topFiles) {
      const codes = [...new Set(errs.map(e => e.code))].slice(0, 3).join(', ');
      sections.push(`| \`${file}\` | ${errs.length} | ${codes} |`);
    }
    sections.push('');
  }

  sections.push(`---\n**Total errors: ${totalErrors}**`);
  return sections.join('\n');
}

try {
  const report = buildMarkdown();
  fs.writeFileSync(REPORT_OUTPUT, report, 'utf8');
  console.log(`Build report written to ${REPORT_OUTPUT}`);
  console.log(report);
} catch (err) {
  console.error('Failed to generate report:', err.message);
  process.exitCode = 1;
}
