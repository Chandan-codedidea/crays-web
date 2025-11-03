/* Updated per task: route payment via WalletContext */
import { bech32 } from "@scure/base";
import { nip04, nip19, nip47, nip57, Relay, relayInit, utils } from "../lib/nTools";
import { Tier } from "../components/SubscribeToAuthorModal/SubscribeToAuthorModal";
import { Kind } from "../constants";
import { MegaFeedPage, NostrRelaySignedEvent, NostrUserZaps, PrimalArticle, PrimalDVM, PrimalNote, PrimalUser, PrimalZap, TopZap } from "../types/primal";
import { logError } from "./logger";
import { decrypt, encrypt, signEvent } from "./nostrAPI";
import { decodeNWCUri } from "./wallet";
import { hexToBytes, parseBolt11 } from "../utils";
import { convertToUser } from "../stores/profile";
import { StreamingData } from "./streaming";
import { getWalletApiForLib } from '../contexts/WalletContext';

export let lastZapError: string | null = null;

async function payBolt11ViaWallet(pr: string) {
  const wallet = getWalletApiForLib();
  if (!wallet || wallet.providerDisabled) throw new Error('Wallet disabled');
  const res = await wallet.sendBolt11(pr);
  if (!res || res.status !== 'success') throw new Error('Payment failed');
  return res;
}

async function payLnurlViaWallet(params: {
  url: string;
  amountMsat: number;
  comment?: string;
  zapRequestJson?: string;
}) {
  const wallet = getWalletApiForLib();
  if (!wallet || wallet.providerDisabled) throw new Error('Wallet disabled');
  const res = await wallet.payLnurlPay(
    params.url,
    params.amountMsat,
    params.comment,
    params.zapRequestJson
  );
  if (!res || res.status !== 'success') throw new Error('LNURL-pay failed');
  return res;
}

// Placeholder functions to be replaced with actual implementations
export async function zapNote(
  note: PrimalNote,
  sender: PrimalUser | undefined,
  amount: number,
  comment?: string,
  relays?: string[]
): Promise<boolean> {
  if (!sender) return false;
  
  const recipient = note.user;
  if (!recipient?.lud16 && !recipient?.lud06) {
    lastZapError = 'Recipient has no Lightning address';
    return false;
  }

  try {
    // Build zap request event (NIP-57)
    const zapRequest = await signEvent({
      kind: 9734,
      content: comment || '',
      tags: [
        ['relays', ...(relays || [])],
        ['amount', String(amount * 1000)],
        ['lnurl', recipient.lud16 || recipient.lud06 || ''],
        ['p', recipient.pubkey],
        ['e', note.id]
      ],
      created_at: Math.floor(Date.now() / 1000)
    });

    if (!zapRequest) {
      lastZapError = 'Failed to sign zap request';
      return false;
    }

    // Fetch invoice from LNURL endpoint
    const lnurl = recipient.lud16 || recipient.lud06 || '';
    const response = await fetch(`https://example.com/.well-known/lnurlp/${lnurl}`);
    const data = await response.json();
    const pr = data.pr; // Payment request/invoice

    try {
      await payBolt11ViaWallet(pr);
      return true;
    } catch (e: any) {
      lastZapError = e?.message || String(e);
      console.error('Failed to zap:', e);
      return false;
    }
  } catch (e: any) {
    lastZapError = e?.message || String(e);
    console.error('Failed to prepare zap:', e);
    return false;
  }
}

export async function zapProfile(
  recipient: PrimalUser,
  sender: PrimalUser | undefined,
  amount: number,
  comment?: string,
  relays?: string[]
): Promise<boolean> {
  if (!sender) return false;
  
  if (!recipient?.lud16 && !recipient?.lud06) {
    lastZapError = 'Recipient has no Lightning address';
    return false;
  }

  try {
    // Build zap request event (NIP-57)
    const zapRequest = await signEvent({
      kind: 9734,
      content: comment || '',
      tags: [
        ['relays', ...(relays || [])],
        ['amount', String(amount * 1000)],
        ['lnurl', recipient.lud16 || recipient.lud06 || ''],
        ['p', recipient.pubkey]
      ],
      created_at: Math.floor(Date.now() / 1000)
    });

    if (!zapRequest) {
      lastZapError = 'Failed to sign zap request';
      return false;
    }

    // Fetch invoice from LNURL endpoint
    const lnurl = recipient.lud16 || recipient.lud06 || '';
    const response = await fetch(`https://example.com/.well-known/lnurlp/${lnurl}`);
    const data = await response.json();
    const pr = data.pr;

    try {
      await payBolt11ViaWallet(pr);
      return true;
    } catch (e: any) {
      lastZapError = e?.message || String(e);
      console.error('Failed to zap:', e);
      return false;
    }
  } catch (e: any) {
    lastZapError = e?.message || String(e);
    console.error('Failed to prepare zap:', e);
    return false;
  }
}

export async function zapArticle(
  article: PrimalArticle,
  sender: PrimalUser | undefined,
  amount: number,
  comment?: string,
  relays?: string[]
): Promise<boolean> {
  if (!sender) return false;
  
  const recipient = article.user;
  if (!recipient?.lud16 && !recipient?.lud06) {
    lastZapError = 'Recipient has no Lightning address';
    return false;
  }

  try {
    // Build zap request event (NIP-57)
    const zapRequest = await signEvent({
      kind: 9734,
      content: comment || '',
      tags: [
        ['relays', ...(relays || [])],
        ['amount', String(amount * 1000)],
        ['lnurl', recipient.lud16 || recipient.lud06 || ''],
        ['p', recipient.pubkey],
        ['a', article.id]
      ],
      created_at: Math.floor(Date.now() / 1000)
    });

    if (!zapRequest) {
      lastZapError = 'Failed to sign zap request';
      return false;
    }

    // Fetch invoice from LNURL endpoint
    const lnurl = recipient.lud16 || recipient.lud06 || '';
    const response = await fetch(`https://example.com/.well-known/lnurlp/${lnurl}`);
    const data = await response.json();
    const pr = data.pr;

    try {
      await payBolt11ViaWallet(pr);
      return true;
    } catch (e: any) {
      lastZapError = e?.message || String(e);
      console.error('Failed to zap:', e);
      return false;
    }
  } catch (e: any) {
    lastZapError = e?.message || String(e);
    console.error('Failed to prepare zap:', e);
    return false;
  }
}

export async function zapStream(
  stream: any,
  sender: PrimalUser | undefined,
  amount: number,
  comment?: string,
  relays?: string[]
): Promise<{ success: boolean; event?: NostrRelaySignedEvent }> {
  if (!sender) return { success: false };
  
  const recipient = stream.user;
  if (!recipient?.lud16 && !recipient?.lud06) {
    lastZapError = 'Recipient has no Lightning address';
    return { success: false };
  }

  try {
    // Build zap request event (NIP-57)
    const zapRequest = await signEvent({
      kind: 9734,
      content: comment || '',
      tags: [
        ['relays', ...(relays || [])],
        ['amount', String(amount * 1000)],
        ['lnurl', recipient.lud16 || recipient.lud06 || ''],
        ['p', recipient.pubkey],
        ['e', stream.id]
      ],
      created_at: Math.floor(Date.now() / 1000)
    });

    if (!zapRequest) {
      lastZapError = 'Failed to sign zap request';
      return { success: false };
    }

    const signedEvent = zapRequest as NostrRelaySignedEvent;

    // Fetch invoice from LNURL endpoint
    const lnurl = recipient.lud16 || recipient.lud06 || '';
    const response = await fetch(`https://example.com/.well-known/lnurlp/${lnurl}`);
    const data = await response.json();
    const pr = data.pr;

    try {
      await payBolt11ViaWallet(pr);
      return { success: true, event: signedEvent };
    } catch (e: any) {
      lastZapError = e?.message || String(e);
      console.error('Failed to zap:', e);
      return { success: false };
    }
  } catch (e: any) {
    lastZapError = e?.message || String(e);
    console.error('Failed to prepare zap:', e);
    return { success: false };
  }
}

// Compat functions
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
