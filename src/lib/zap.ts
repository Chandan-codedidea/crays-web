// --- COMPAT: legacy export expected by CustomZap.tsx  -----------------
// Relay type placeholder (should be imported from nostr-tools or similar)
type Relay = any;

// Global error tracker
export let lastZapError: string | null = null;

// --- Core zap functions (thin wrappers for Breez Wallet flow) ---
export const zapProfile = async (
  profile: any,
  sender: string | undefined,
  amount: number,
  comment = '',
  relays: Relay[],
  nwc?: string[],
): Promise<boolean> => {
  try {
    // TODO: Implement Breez Wallet profile zap logic here
    // For now, this is a placeholder that returns false
    lastZapError = 'zapProfile: not yet implemented';
    return false;
  } catch (e: any) {
    lastZapError = e?.message ?? String(e);
    return false;
  }
};

export const zapNote = async (
  note: any,
  sender: string | undefined,
  amount: number,
  comment = '',
  relays: Relay[],
  nwc?: string[],
): Promise<boolean> => {
  try {
    // TODO: Implement Breez Wallet note zap logic here
    // For now, this is a placeholder that returns false
    lastZapError = 'zapNote: not yet implemented';
    return false;
  } catch (e: any) {
    lastZapError = e?.message ?? String(e);
    return false;
  }
};

export const zapArticle = async (
  article: any,
  sender: string | undefined,
  amount: number,
  comment = '',
  relays: Relay[],
  nwc?: string[],
): Promise<boolean> => {
  try {
    // Route article zaps through note zaps
    return await zapNote(article, sender, amount, comment, relays, nwc);
  } catch (e: any) {
    lastZapError = e?.message ?? String(e);
    return false;
  }
};

export const zapStream = async (
  stream: any,
  sender: string | undefined,
  amount: number,
  comment = '',
  relays: Relay[],
  nwc?: string[],
): Promise<boolean> => {
  try {
    // Route stream zaps through profile zaps if host exists
    if (stream?.host) {
      return await zapProfile(stream.host, sender, amount, comment, relays, nwc);
    }
    lastZapError = 'zapStream: no host found';
    return false;
  } catch (e: any) {
    lastZapError = e?.message ?? String(e);
    return false;
  }
};

export const zapDVM = async (
  dvm: any,
  sender: string | undefined,
  amount: number,
  comment = '',
  relays: Relay[],
  nwc?: string[],
) => {
  try {
    // If the DVM object carries a host/user, treat it like a profile zap
    if (dvm && (dvm.host || dvm.owner || dvm.user)) {
      const targetUser = (dvm.host || dvm.owner || dvm.user) as any;
      return await zapProfile(targetUser, sender, amount, comment, relays, nwc);
    }
    // If the DVM points to a note/job/event, treat it like a note zap
    if (dvm && (dvm.note || dvm.event)) {
      const targetNote = (dvm.note || dvm.event) as any;
      return await zapNote(targetNote, sender, amount, comment, relays, nwc);
    }
    // Fallback: not enough info to route a zap
    lastZapError = 'zapDVM: unsupported target';
    return false;
  } catch (e: any) {
    lastZapError = e?.message ?? String(e);
    return false;
  }
};
// --- COMPAT: legacy exports expected by UI components ---
export function canUserReceiveZaps(
  meta?: { lud16?: string | null; lud06?: string | null }
): boolean {
  return Boolean(meta?.lud16 || meta?.lud06);
}
export function convertToZap(
  input: number | string | { amount?: number; amountMsat?: number; comment?: string },
  opts?: { unit?: 'sat' | 'msat'; comment?: string }
): { amountMsat: number; comment?: string } {
  if (input && typeof input === 'object') {
    const amountMsat =
      typeof input.amountMsat === 'number'
        ? Math.round(input.amountMsat)
        : typeof input.amount === 'number'
          ? Math.round(input.amount * 1000)
          : 0;
    return { amountMsat, comment: input.comment ?? opts?.comment };
  }
  const n = Number(input);
  const amountMsat = Number.isFinite(n)
    ? Math.round(opts?.unit === 'msat' ? n : n * 1000)
    : 0;
  return { amountMsat, comment: opts?.comment };
}
export const zapSubscription = async (
  subscription: any,
  sender: string | undefined,
  amount: number,
  comment = '',
  relays: Relay[],
  nwc?: string[],
) => {
  // Compat wrapper: route subscription zaps through profile zaps
  if (subscription && subscription.recipient) {
    return await zapProfile(subscription.recipient, sender, amount, comment, relays, nwc);
  }
  lastZapError = 'zapSubscription: no recipient';
  return false;
};
