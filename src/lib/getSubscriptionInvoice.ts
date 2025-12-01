import { getZapEndpoint } from "./zap"; 
/**
 * Gets a Lightning invoice (payment request) for subscribing to a target user via LNURL-pay.
 *
 * @param targetPubkey Nostr pubkey of the profile you're subscribing to
 * @param months Number of months for the subscription
 * @param pricePerMonth The monthly price in sats (integer)
 * @returns {Promise<string>} Payment request (Lightning invoice) for the total subscription period
 *
 * Throws if LNURL endpoint or invoice are not available
 */
export async function getSubscriptionInvoice(
  targetPubkey: string,
  months: number,
  pricePerMonth: number
): Promise<string> {
  // 1. Fetch the target user profile by pubkey (must include lud16 or lud06 Lightning address)
  const user = await fetchUserByPubkey(targetPubkey);
  if (!user || (!user.lud16 && !user.lud06)) {
    throw new Error("User does not have a Lightning address configured");
  }

  // 2. Get their LNURL-pay endpoint callback
  const lnurlCallback = await getZapEndpoint(user);
  if (!lnurlCallback) {
    throw new Error("LNURL endpoint not found for this user");
  }

  // 3. Calculate the total price in millisats (Lightning expects millisats)
  const totalSats = months * pricePerMonth;
  const msats = totalSats * 1000;

  // 4. Compose an optional comment for the vendor's server (can help for bookkeeping)
  const comment = `Subscription for ${months} month(s) (${totalSats} sats) via Nostr`;

  // 5. Request invoice from vendor LNURL server
  const lnurlURL = `${lnurlCallback}?amount=${msats}&comment=${encodeURIComponent(comment)}`;
  const response = await fetch(lnurlURL);
  if (!response.ok) {
    throw new Error(`Failed to fetch invoice from LNURL: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.pr) {
    throw new Error("Invoice not found in LNURL response");
  }

  // 6. Return Lightning payment request
  return data.pr;
}
