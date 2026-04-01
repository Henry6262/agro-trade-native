# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `main`  | ✅        |
| `dev`   | ✅ (pre-release) |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, use one of the following channels:

1. **GitHub Private Security Advisory** — open a draft advisory at
   `https://github.com/Henry6262/agro-trade-native/security/advisories/new`
2. **Email** — send details to the repository owner's email visible on their
   GitHub profile.

### What to include

- Description of the vulnerability and affected component
- Steps to reproduce (PoC code or HTTP request if applicable)
- Potential impact (data exposure, privilege escalation, funds at risk, etc.)
- Suggested fix (optional but appreciated)

### Response SLA

| Action | Target time |
| ------ | ----------- |
| Acknowledgement | 48 hours |
| Initial assessment | 5 business days |
| Patch + disclosure | 30 days (critical: 7 days) |

## Smart Contract Security

Contracts in `contracts/` (EVM) and `contracts-solana/` (Solana/Anchor) handle
real value. Before mainnet deployment:

- A third-party audit is required.
- All high/critical CodeQL or Slither findings must be resolved.
- On-chain upgrades follow a time-locked multisig process.
