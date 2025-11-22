# Backlog

Ideas to consider after the five core epics reach "Complete" status.

- **Shared DTO package** – Publish reusable TypeScript types to npm (consumed by backend + mobile + admin) so future integrations stay aligned.
- **Offline-first mobile mode** – Cache recent trades/orders + optimistic mutations for low-connectivity use cases.
- **Telemetry dashboards** – Connect `node scripts/atctl.mjs` outputs to Grafana to monitor lint/test/doc drift over time.
- **Design token sync** – Automate exporting tokens from Figma and piping them into `app/components/ui` and backend email templates.
- **Synthetic data generators** – Extend Puppeteer scripts to seed realistic trades/orders for QA environments.
- **Shared store alignment (mobile)** – Normalize transporter/inspector feature stores to the rulebook pattern; remove any remaining ad hoc state in components.
- **EP-03 polish** – Add lightweight tests/docs for the newly wired transporter fleet/maps flows and timeline features; tackle remaining P2 lint warnings in touched files only.
