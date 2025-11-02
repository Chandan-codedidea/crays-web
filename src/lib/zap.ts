import { bech32 } from "@scure/base";
import { nip04, nip19, nip47, nip57, Relay, relayInit, utils } from "../lib/nTools";
import { Tier } from "../components/SubscribeToAuthorModal/SubscribeToAuthorModal";
import { Kind } from "../constants";
import { MegaFeedPage, NostrRelaySignedEvent, NostrUserZaps, PrimalArticle, PrimalDVM, PrimalNote, PrimalUser, PrimalZap, TopZap } from "../types/primal";
import { logError } from "./logger";
import { decrypt, enableWebLn, encrypt, sendPayment, signEvent } from "./nostrAPI";
import { decodeNWCUri } from "./wallet";
import { hexToBytes, parseBolt11 } from "../utils";
import { convertToUser } from "../stores/profile";
import { StreamingData } from "./streaming";

export let lastZapError: string = "";

export const zapOverNWC = async (pubkey: string, nwcEnc: string, invoice: string) => {
  let promises: Promise<boolean>[] = [];
  let relays: Relay[] = [];
  let result: boolean = false;

  try {
    const nwc = await decrypt(pubkey, nwcEnc);
    const nwcConfig = decodeNWCUri(nwc);
    const request = await nip47.makeNwcRequestEvent(nwcConfig.pubkey, hexToBytes(nwcConfig.secret), invoice)
    if (nwcConfig.relays.length === 0) return false;

    for (let i = 0; i < nwcConfig.relays.length; i++) {
      const relay = relayInit(nwcConfig.relays[i]);
      promises.push(new Promise(async (resolve) => {
        await relay.connect();
        relays.push(relay);
        const subInfo = relay.subscribe([{
          kinds: [23195],
          authors: [nwcConfig.pubkey],
          "#e": [request.id],
        }], {
          onevent: async (event) => {
            result = true;
            subInfo.unsub();
            resolve(true);
          },
          oneose: () => { },
        });
        await relay.publish(request);
      }));
    }

    const success = await Promise.race(promises);

    return success;
  }
  catch (e) {
    logError('zapOverNWC error:', e);
    lastZapError = String(e);
    return false;
  }
  finally {
    relays.forEach(r => r.close());
  }
};

export const convertToZap = (zapContent: NostrUserZaps) => {
  const bolt11 = (zapContent.tags.find(t => t[0] === 'bolt11') || [])[1];
  const zapEvent = JSON.parse((zapContent.tags.find(t => t[0] === 'description') || [])[1] || '{}');

  const senderPubkey = zapEvent.pubkey as string;
  const receiverPubkey = zapEvent.tags.find((t: string[]) => t[0] === 'p')[1] as string;

  let zappedId = '';
  let zappedKind: number = 0;

  const zap: PrimalZap = {
    id: zapContent.id,
    message: zapEvent.content || '',
    amount: parseBolt11(bolt11) || 0,
    sender: senderPubkey,
    reciver: receiverPubkey,
    created_at: zapContent.created_at,
    zappedId,
    zappedKind,
  };

  return zap;
}

// --- compat: keep StreamPage import working ---
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
