const configuredPilotContact =
  process.env.NEXT_PUBLIC_PILOT_CONTACT_EMAIL?.trim() ?? "";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const pilotContactEmail = emailPattern.test(configuredPilotContact)
  ? configuredPilotContact
  : null;

export function pilotContactHref(subject: string) {
  if (!pilotContactEmail) return null;

  return `mailto:${pilotContactEmail}?subject=${encodeURIComponent(subject)}`;
}
