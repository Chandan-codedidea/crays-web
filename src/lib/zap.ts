import { bech32 } from "@scure/base";
import {
  nip04,
  nip19,
  nip47,
  nip57,
  Relay,
  relayInit,
  utils,
} from "../lib/nTools";
import { Tier } from "../components/SubscribeToAuthorModal/SubscribeToAuthorModal";
import { Kind } from "../constants";
import {
  MegaFeedPage,
  NostrRelaySignedEvent,
  NostrUserZaps,
  PrimalArticle,
  PrimalDVM,
  PrimalNote,
  PrimalUser,
  PrimalZap,
  TopZap,
} from "../types/primal";
import { logError } from "./logger";
import {
  decrypt,
  enableWebLn,
  encrypt,
  sendPayment,
  signEvent,
} from "./nostrAPI";
import { decodeNWCUri } from "./wallet";
import { hexToBytes, parseBolt11 } from "../utils";
import { convertToUser } from "../stores/profile";
import { StreamingData } from "./streaming";
import { WalletContextValue } from "../contexts/WalletContext";

export let lastZapError: string = "";

export const zapOverNWC = async (
  pubkey: string,
  nwcEnc: string,
  invoice: string
) => {
  let promises: Promise<boolean>[] = [];
  let relays: Relay[] = [];
  let result: boolean = false;
  try {
    const nwc = await decrypt(pubkey, nwcEnc);

    const nwcConfig = decodeNWCUri(nwc);

    const request = await nip47.makeNwcRequestEvent(
      nwcConfig.pubkey,
      hexToBytes(nwcConfig.secret),
      invoice
    );

    if (nwcConfig.relays.length === 0) return false;

    for (let i = 0; i < nwcConfig.relays.length; i++) {
      const relay = relayInit(nwcConfig.relays[i]);

      promises.push(
        new Promise(async (resolve) => {
          await relay.connect();

          relays.push(relay);

          const subInfo = relay.subscribe(
            [{ kinds: [13194], authors: [nwcConfig.pubkey] }],
            {
              onevent(event) {
                const nwcInfo = event.content.split(" ");
                if (nwcInfo.includes("pay_invoice")) {
                  const subReq = relay.subscribe(
                    [{ kinds: [23195], ids: [request.id] }],
                    {
                      async onevent(eventResponse) {
                        if (
                          !eventResponse.tags.find(
                            (t) => t[0] === "e" && t[1] === request.id
                          )
                        )
                          return;

                        const decoded = await nip04.decrypt(
                          hexToBytes(nwcConfig.secret),
                          nwcConfig.pubkey,
                          eventResponse.content
                        );
                        const content = JSON.parse(decoded);

                        if (content.error) {
                          logError("Failed NWC payment: ", content.error);
                          console.error("Failed NWC payment: ", content.error);
                          subReq.close();
                          subInfo.close();
                          resolve(false);
                          return;
                        }

                        subReq.close();
                        subInfo.close();
                        resolve(true);
                      },
                    }
                  );

                  relay.publish(request);
                }
              },
            }
          );
        })
      );
    }

    result = await Promise.any(promises);
  } catch (e: any) {
    logError("Failed NWC payment init: ", e);
    console.error("Failed NWC payment init: ", e);
    lastZapError = e;
    result = false;
  }

  for (let i = 0; i < relays.length; i++) {
    const relay = relays[i];
    relay.close();
  }

  return result;
};

export const zapNote = async (
  note: PrimalNote,
  sender: string | undefined,
  amount: number,
  comment = "",
  relays: Relay[],
  wallet?: WalletContextValue
): Promise<{ success: boolean; error?: string }> => {
  if (!sender) {
    return { success: false, error: "Sender is undefined" };
  }

  const callback = await getZapEndpoint(note.user);

  if (!callback) {
    return { success: false, error: "Zap endpoint not found for user" };
  }

  const millisats = amount * 1000;

  let payload = {
    profile: note.pubkey,
    event: note.id,
    amount: millisats,
    relays: relays.map((r) => r.url),
  };

  if (comment.length > 0) {
    payload.comment = comment;
  }

  const zapReq = nip57.makeZapRequest(payload);

  try {
    const signedEvent = await signEvent(zapReq);
    const event = encodeURIComponent(JSON.stringify(signedEvent));
    const r2 = await (await fetch(`${callback}?amount=${millisats}&nostr=${event}`)).json();
    const pr = r2.pr;

    if (wallet) {
      try {
        const prepared = await wallet.prepareSendPayment({
          paymentRequest: pr,
          amount: BigInt(amount),
        });

        await wallet.sendPayment({ prepareResponse: prepared });
        return { success: true };
      } catch (paymentError: any) {
        console.error("Breez payment failed:", paymentError);
        // Optional: check error messages to customize
        return { success: false, error: paymentError.message || "Payment failed" };
      }
    }

    return { success: false, error: "No wallet provided for zap" };
  } catch (reason: any) {
    console.error("Failed to zap: ", reason);
    return { success: false, error: reason.message || "Failed to zap" };
  }
};


export const zapArticle = async (
  note: PrimalArticle,
  sender: string | undefined,
  amount: number,
  comment = "",
  relays: Relay[],
  wallet?: WalletContextValue
): Promise<{ success: boolean; error?: string }> => {
  if (!sender) {
    return { success: false, error: "Sender is undefined" };
  }

  const callback = await getZapEndpoint(note.user);

  if (!callback) {
    return { success: false, error: "Zap endpoint not found for user" };
  }

  const a = `${Kind.LongForm}:${note.pubkey}:${
    (note.msg.tags.find((t) => t[0] === "d") || [])[1]
  }`;

  const sats = Math.round(amount * 1000);

  let payload = {
    profile: note.pubkey,
    event: note.msg.id,
    amount: sats,
    relays: relays.map((r) => r.url),
  };

  if (comment.length > 0) {
    // @ts-ignore
    payload.comment = comment;
  }

  const zapReq = nip57.makeZapRequest(payload);

  if (!zapReq.tags.find((t: string[]) => t[0] === "a" && t[1] === a)) {
    zapReq.tags.push(["a", a]);
  }

  try {
    const signedEvent = await signEvent(zapReq);

    const event = encodeURIComponent(JSON.stringify(signedEvent));

    const r2 = await (
      await fetch(`${callback}?amount=${sats}&nostr=${event}`)
    ).json();
    const pr = r2.pr;

    // ✅ Pay with Breez SDK
    if (wallet) {
      try {
        const prepared = await wallet.prepareSendPayment({
          paymentRequest: pr,
          amount: BigInt(amount),
        });

        await wallet.sendPayment({ prepareResponse: prepared });

        return { success: true };
      } catch (paymentError: any) {
        console.error("Breez payment failed:", paymentError);
        return {
          success: false,
          error: paymentError.message || "Payment failed",
        };
      }
    }

    return { success: false, error: "No wallet provided for zap" };
  } catch (reason: any) {
    console.error("Failed to zap article: ", reason);
    return { success: false, error: reason.message || "Failed to zap article" };
  }
};


export const zapProfile = async (
  profile: PrimalUser,
  sender: string | undefined,
  amount: number,
  comment = "",
  relays: Relay[],
  wallet?: WalletContextValue
): Promise<{ success: boolean; error?: string }> => {
  if (!sender || !profile) {
    return { success: false, error: "Sender or profile is not defined" };
  }

  const callback = await getZapEndpoint(profile);

  if (!callback) {
    return { success: false, error: "Could not find zap endpoint for profile" };
  }

  const millisats = amount * 1000;

  let payload = {
    profile: profile.pubkey,
    amount: millisats,
    relays: relays.map((r) => r.url),
  };

  if (comment.length > 0) {
    payload.comment = comment;
  }

  const zapReq = nip57.makeZapRequest(payload);

  try {
    const signedEvent = await signEvent(zapReq);
    const event = encodeURIComponent(JSON.stringify(signedEvent));
    const r2 = await (
      await fetch(`${callback}?amount=${millisats}&nostr=${event}`)
    ).json();
    const pr = r2.pr;

    if (wallet) {
      try {
        const prepared = await wallet.prepareSendPayment({
          paymentRequest: pr,
          amount: BigInt(amount),
        });

        await wallet.sendPayment({ prepareResponse: prepared });
        return { success: true };
      } catch (paymentError: any) {
        console.error("Breez payment failed:", paymentError);

        // Detect insufficient funds
        if (
          paymentError.message?.includes(
            "Tree service error: insufficient funds"
          )
        ) {
          return {
            success: false,
            error: "Insufficient funds in wallet to complete zap.",
          };
        }

        return {
          success: false,
          error: paymentError.message || "Failed to complete zap payment.",
        };
      }
    }

    return { success: false, error: "No wallet connected" };
  } catch (reason: any) {
    console.error("Failed to zap profile: ", reason);
    return { success: false, error: reason.message || "Failed to zap profile" };
  }
};

export const zapSubscription = async (
  subEvent: NostrRelaySignedEvent,
  recipient: PrimalUser,
  sender: string | undefined,
  relays: Relay[],
  exchangeRate?: Record<string, Record<string, number>>,
  wallet?: WalletContextValue
): Promise<{ success: boolean; error?: string }> => {
  if (!sender || !recipient) {
    return { success: false, error: "Sender or recipient not defined" };
  }

  const callback = await getZapEndpoint(recipient);
  if (!callback) return { success: false, error: "Zap endpoint not found" };

  // Calculate sats based on tags, exchange rate
  let sats = 0;
  const costTag = subEvent.tags.find((t) => t[0] === "amount");
  if (!costTag) return { success: false, error: "No amount specified" };

  if (costTag[2] === "sats") sats = parseInt(costTag[1]) * 1000;
  else if (costTag[2] === "msat") sats = parseInt(costTag[1]);
  else if (costTag[2] === "USD" && exchangeRate && exchangeRate["USD"]) {
    const usd = parseFloat(costTag[1]);
    sats = Math.ceil(exchangeRate["USD"].sats * usd * 1000);
  }

  let payload = {
    profile: recipient.pubkey,
    event: subEvent.id,
    amount: sats,
    relays: relays.map((r) => r.url),
  };

  if (subEvent.content.length > 0) {
    payload.comment = subEvent.content;
  }

  const zapReq = nip57.makeZapRequest(payload);

  try {
    const signedEvent = await signEvent(zapReq);
    const event = encodeURIComponent(JSON.stringify(signedEvent));
    const r2 = await (
      await fetch(`${callback}?amount=${sats}&nostr=${event}`)
    ).json();
    const pr = r2.pr;

    if (wallet) {
      try {
        const amountSats = Math.ceil(sats / 1000);
        const prepared = await wallet.prepareSendPayment({
          paymentRequest: pr,
          amount: BigInt(amountSats),
        });

        await wallet.sendPayment({ prepareResponse: prepared });
        return { success: true };
      } catch (paymentError: any) {
        console.error("Breez payment failed:", paymentError);
        if (paymentError.message?.includes("insufficient funds")) {
          return { success: false, error: "Insufficient funds in wallet" };
        }
        return {
          success: false,
          error: paymentError.message || "Payment failed",
        };
      }
    }
    return { success: false, error: "No wallet connected" };
  } catch (reason: any) {
    console.error("Failed to zap subscription: ", reason);
    return {
      success: false,
      error: reason.message || "Zap subscription failed",
    };
  }
};

export const zapDVM = async (
  dvm: PrimalDVM,
  author: PrimalUser,
  sender: string | undefined,
  amount: number,
  comment = "",
  relays: Relay[],
  wallet?: WalletContextValue
): Promise<{ success: boolean; error?: string }> => {
  if (!sender) {
    return { success: false, error: "Sender undefined" };
  }

  const callback = await getZapEndpoint(author);
  if (!callback) return { success: false, error: "Zap endpoint not found" };

  const a = `${Kind.DVM}:${dvm.pubkey}:${dvm.identifier}`;
  const sats = Math.round(amount * 1000);

  let payload = {
    profile: dvm.pubkey,
    event: dvm.id,
    amount: sats,
    relays: relays.map((r) => r.url),
  };
  if (comment.length > 0) payload.comment = comment;

  const zapReq = nip57.makeZapRequest(payload);
  if (!zapReq.tags.find((t) => t[0] === "a" && t[1] === a)) {
    zapReq.tags.push(["a", a]);
  }

  try {
    const signedEvent = await signEvent(zapReq);
    const event = encodeURIComponent(JSON.stringify(signedEvent));
    const r2 = await (
      await fetch(`${callback}?amount=${sats}&nostr=${event}`)
    ).json();
    const pr = r2.pr;

    if (wallet) {
      try {
        const prepared = await wallet.prepareSendPayment({
          paymentRequest: pr,
          amount: BigInt(amount),
        });
        await wallet.sendPayment({ prepareResponse: prepared });
        return { success: true };
      } catch (paymentError: any) {
        console.error("Breez payment failed:", paymentError);
        if (paymentError.message?.includes("insufficient funds")) {
          return { success: false, error: "Insufficient funds in wallet" };
        }
        return {
          success: false,
          error: paymentError.message || "Payment failed",
        };
      }
    }
    return { success: false, error: "No wallet connected" };
  } catch (reason: any) {
    console.error("Failed to zap DVM: ", reason);
    return { success: false, error: reason.message || "Zap DVM failed" };
  }
};

export const zapStream = async (
  stream: StreamingData,
  host: PrimalUser | undefined,
  sender: string | undefined,
  amount: number,
  comment = "",
  relays: Relay[],
  wallet?: WalletContextValue
): Promise<{ success: boolean; error?: string; event?: any }> => {
  if (!sender || !host) {
    return { success: false, error: "Sender or host undefined" };
  }

  const callback = await getZapEndpoint(host);
  if (!callback) return { success: false, error: "Zap endpoint not found" };

  const a = `${Kind.LiveEvent}:${stream.pubkey}:${stream.id}`;
  const sats = Math.round(amount * 1000);

  let payload = {
    profile: host.pubkey,
    event: stream.event?.id || null,
    amount: sats,
    relays: relays.map((r) => r.url),
  };
  if (comment.length > 0) payload.comment = comment;

  const zapReq = nip57.makeZapRequest(payload);
  if (!zapReq.tags.find((t: string[]) => t[0] === "a" && t[1] === a)) {
    zapReq.tags.push(["a", a]);
  }

  try {
    const signedEvent = await signEvent(zapReq);
    const event = encodeURIComponent(JSON.stringify(signedEvent));
    const r2 = await (
      await fetch(`${callback}?amount=${sats}&nostr=${event}`)
    ).json();
    const pr = r2.pr;

    if (wallet) {
      try {
        const prepared = await wallet.prepareSendPayment({
          paymentRequest: pr,
          amount: BigInt(amount),
        });
        await wallet.sendPayment({ prepareResponse: prepared });
        return { success: true, event: signedEvent };
      } catch (paymentError: any) {
        console.error("Breez payment failed:", paymentError);
        if (paymentError.message?.includes("insufficient funds")) {
          return { success: false, error: "Insufficient funds in wallet" };
        }
        return {
          success: false,
          error: paymentError.message || "Payment failed",
        };
      }
    }
    return { success: false, error: "No wallet connected" };
  } catch (reason: any) {
    console.error("Failed to zap stream: ", reason);
    return { success: false, error: reason.message || "Zap stream failed" };
  }
};

export const getZapEndpoint = async (
  user: PrimalUser
): Promise<string | null> => {
  try {
    let lnurl: string = "";
    let { lud06, lud16 } = user;

    if (lud16) {
      let [name, domain] = lud16.split("@");
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
    } else if (lud06) {
      let { words } = bech32.decode(lud06, 1023);
      let data = bech32.fromWords(words);
      lnurl = utils.utf8Decoder.decode(data);
    } else {
      return null;
    }

    try {
      let res = await fetch(lnurl);
      let body = await res.json();

      if (body.allowsNostr && body.nostrPubkey) {
        return body.callback;
      }
    } catch (e) {
      logError("LNURL: ", lnurl);
      logError("Error fetching lnurl: ", e);
      return null;
    }
  } catch (err) {
    logError("Error zapping: ", err);
    return null;
    /*-*/
  }

  return null;
};

export const canUserReceiveZaps = (user: PrimalUser | undefined) => {
  return !!user && (!!user.lud16 || !!user.lud06);
};

export const convertToZap = (zapContent: NostrUserZaps) => {
  const bolt11 = (zapContent.tags.find((t) => t[0] === "bolt11") || [])[1];
  const zapEvent = JSON.parse(
    (zapContent.tags.find((t) => t[0] === "description") || [])[1] || "{}"
  );
  const senderPubkey = zapEvent.pubkey as string;
  const receiverPubkey = zapEvent.tags.find(
    (t: string[]) => t[0] === "p"
  )[1] as string;

  let zappedId = "";
  let zappedKind: number = 0;

  const zap: PrimalZap = {
    id: zapContent.id,
    message: zapEvent.content || "",
    amount: parseBolt11(bolt11) || 0,
    sender: senderPubkey,
    reciver: receiverPubkey,
    created_at: zapContent.created_at,
    zappedId,
    zappedKind,
  };

  return zap;
};
