// src/lib/nostrSubscriptions.ts
import { SimplePool } from 'nostr-tools';
import { getPublicKey, signEvent } from './nostrAPI';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

export const fetchUserSubscriptionSettings = async (profilePubkey: string) => {
  const filter = {
    kinds: [30078],
    authors: [profilePubkey],
    '#d': ['subscription-settings']
  };

  const pool = new SimplePool();
  const events = await pool.querySync(RELAYS, filter);

  if (events.length > 0) {
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
    const settings = JSON.parse(latestEvent.content);
    return settings;
  } else {
    return null;
  }
};


export const publishSubscriptionReceipt = async (
  targetPubkey: string,
  months: number,
  amount: number,
  paymentHash?: string // Optional, from Lightning wallet after payment
): Promise<void> => {
  const myPubkey = await getPublicKey(); // Subscriber's pubkey

  const event = {
    kind: 30079, // Custom kind for subscription receipts
    created_at: Math.floor(Date.now() / 1000),
    pubkey: myPubkey,
    tags: [
      ["p", targetPubkey],
      ["months", String(months)],
      ["amount", String(amount)],
      ...(paymentHash ? [["payment_hash", paymentHash]] : [])
    ],
    content: "Subscription payment receipt for access"
  };

  const signedEvent = await signEvent(event); // Sign event with subscriber's key

  const pool = new SimplePool();
  await pool.publish(RELAYS, signedEvent);
};




// Checks if viewer has a valid subscription receipt for creator
export async function validateSubscriptionAccess(viewerPubkey: string, creatorPubkey: string): Promise<boolean> {
  const pool = new SimplePool();
  const filter = {
    kinds: [30079],
    authors: [viewerPubkey],
    "#p": [creatorPubkey],
  };
  const events = await pool.querySync(RELAYS, filter);
  if (events.length === 0) return false;
  // Use latest event
  const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
  // Extract months from tags
  let months = 0;
  for (const t of latestEvent.tags) {
    if (t[0] === "months") months = parseInt(t[1], 10);
  }
  const expiry = latestEvent.created_at + months * 30 * 24 * 60 * 60;
  return Math.floor(Date.now() / 1000) < expiry;
}