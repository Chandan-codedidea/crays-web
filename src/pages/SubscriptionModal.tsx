import { Component, createSignal, For, Show, onMount, createEffect } from "solid-js";
import styles from "./SubscriptionModal.module.scss";
import { getPublicKey, signEvent } from "../lib/nostrAPI";
import { SimplePool } from "nostr-tools";
import { fetchUserSubscriptionSettings } from "../lib/nostrSubscriptions";
import { useProfileContext } from "../contexts/ProfileContext";


interface BundleConfig {
  months: number;
  discountPercent: number;
  totalSats: number;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscribers?: {
    active: number;
    expiringSoon: number;
    lapsed: number;
  };
  currentEarnings?: {
    subscriptions: number;
    ppv: number;
    tips: number;
    paidDMs: number;
  };
}

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

const DEFAULT_BUNDLES: BundleConfig[] = [
  { months: 3, discountPercent: 10, totalSats: 27000 },
  { months: 6, discountPercent: 15, totalSats: 51000 },
  { months: 12, discountPercent: 25, totalSats: 90000 },
];

const MIN_PRICE = 10000;
const MAX_PRICE = 500000;
const SATS_TO_USD = 0.0004;

const SubscriptionModal: Component<SubscriptionModalProps> = (props) => {
  const [monthlyPrice, setMonthlyPrice] = createSignal<number>(10000);
  const [bundles, setBundles] = createSignal<BundleConfig[]>(DEFAULT_BUNDLES.map(b => ({ ...b })));
  const [loading, setLoading] = createSignal(false);
  const profile = useProfileContext();

  // Load current subscription settings when modal opens
  createEffect(async () => {
  if (props.isOpen) {
    const settings = await fetchUserSubscriptionSettings(profile?.profileKey);
    if (settings && typeof settings.monthlyPrice === "number" && Array.isArray(settings.bundles)) {
      setMonthlyPrice(settings.monthlyPrice);
      setBundles(settings.bundles.map((b: any) => ({
        months: b.months,
        discountPercent: b.discountPercent,
        totalSats: b.totalSats || (b.months && b.discountPercent
          ? Math.floor(settings.monthlyPrice * b.months * (1 - b.discountPercent / 100))
          : 0),
      })));
      console.log("Loaded from Nostr:", settings);
    } else {
      // If no existing config, use defaults
      setMonthlyPrice(10000);
      setBundles(DEFAULT_BUNDLES.map(b => ({ ...b })));
      console.log("Using default subscription settings");
    }
  }
});

  const subscribers = () =>
    props.currentSubscribers || { active: 0, expiringSoon: 0, lapsed: 0 };
  const earnings = () =>
    props.currentEarnings || { subscriptions: 0, ppv: 0, tips: 0, paidDMs: 0 };

  const calculateBundleTotal = (months: number, discount: number): number => {
    const basePrice = monthlyPrice() * months;
    return Math.floor(basePrice * (1 - discount / 100));
  };

  const handleBundleChange = (
    index: number,
    field: keyof BundleConfig,
    value: number
  ) => {
    setBundles((prev) => {
      const newBundles = [...prev];
      newBundles[index] = { ...newBundles[index], [field]: value };

      if (field === "discountPercent" || field === "months") {
        newBundles[index].totalSats = calculateBundleTotal(
          newBundles[index].months,
          newBundles[index].discountPercent
        );
      }

      return newBundles;
    });
  };

  const handleMonthlyPriceChange = (value: number) => {
    let valid = Math.max(MIN_PRICE, Math.min(value, MAX_PRICE));
    setMonthlyPrice(valid);
    setBundles((prev) =>
      prev.map((bundle) => ({
        ...bundle,
        totalSats: calculateBundleTotal(
          bundle.months,
          bundle.discountPercent
        ),
      }))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const pubkey = await getPublicKey();
      const settings = {
        monthlyPrice: monthlyPrice(),
        bundles: bundles(),
        version: '1.0'
      };
      const event = {
        kind: 30078,
        created_at: Math.floor(Date.now() / 1000),
        pubkey,
        tags: [
          ['d', 'subscription-settings'],
          ['app', 'crays']
        ],
        content: JSON.stringify(settings)
      };
      const signedEvent = await signEvent(event);
      const pool = new SimplePool();
      await pool.publish(RELAYS, signedEvent);

      alert('Subscription settings saved to Nostr relays!');
      props.onClose();
    } catch (err) {
      alert('Could not save settings: ' + err);
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <Show when={props.isOpen}>
      <div class={styles.subscriptionModalOverlay} onClick={props.onClose}>
        <div class={styles.subscriptionModal} onClick={(e) => e.stopPropagation()}>
          <div class={styles.modalHeader}>
            <button class={styles.backButton} onClick={props.onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <h2>Subscriptions & Pricing</h2>
          </div>
          <div class={styles.modalContent}>
            {/* Monthly Price Section */}
            <div class={styles.pricingSection}>
              <h3>Monthly price (Lightning)</h3>
              <input
                type="number"
                class={styles.priceInput}
                value={monthlyPrice()}
                onInput={e =>
                  handleMonthlyPriceChange(Number(e.currentTarget.value))
                }
                min={MIN_PRICE}
                max={MAX_PRICE}
              />
              <div class={styles.priceInfo}>
                <span class={styles.priceRange}>
                  Min {MIN_PRICE.toLocaleString()} sats · Max{" "}
                  {MAX_PRICE.toLocaleString()} sats
                </span>
                <span class={styles.usdEquivalent}>
                  ≈ ${(monthlyPrice() * SATS_TO_USD).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Bundles & Promotions */}
            <div class={styles.bundlesSection}>
              <h3>Bundles & promotions</h3>
              <For each={bundles()}>
                {(bundle, index) => (
                  <div class={styles.bundleRow}>
                    <span class={styles.bundleLabel}>
                      {bundle.months} month bundle
                    </span>
                    <div class={styles.bundleControls}>
                      <div class={styles.discountInput}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={bundle.discountPercent}
                          class={styles.discountNumberInput}
                          onInput={e => {
                            let val = Number(e.currentTarget.value);
                            if (val < 0) val = 0;
                            if (val > 100) val = 100;
                            handleBundleChange(index(), "discountPercent", val);
                          }}
                        />
                        <span class={styles.arrowButtons}>
                          <button
                            onClick={() =>
                              handleBundleChange(
                                index(),
                                "discountPercent",
                                Math.min(bundle.discountPercent + 1, 100)
                              )
                            }
                          >
                            ▲
                          </button>
                          <button
                            onClick={() =>
                              handleBundleChange(
                                index(),
                                "discountPercent",
                                Math.max(bundle.discountPercent - 1, 0)
                              )
                            }
                          >
                            ▼
                          </button>
                        </span>
                      </div>
                      <span class={styles.percentOff}>% off</span>
                      <span class={styles.bundleTotal}>
                        {bundle.totalSats.toLocaleString()} sats
                      </span>
                    </div>
                  </div>
                )}
              </For>
            </div>

            {/* Subscribers Stats */}
            <div class={styles.subscribersSection}>
              <h3>Subscribers</h3>
              <div class={styles.statsGrid}>
                <div class={styles.statCard}>
                  <div class={styles.statValue}>{props.currentSubscribers?.active ?? 0}</div>
                  <div class={styles.statLabel}>Active</div>
                </div>
                <div class={styles.statCard}>
                  <div class={styles.statValue}>{props.currentSubscribers?.expiringSoon ?? 0}</div>
                  <div class={styles.statLabel}>Expiring soon</div>
                </div>
                <div class={styles.statCard}>
                  <div class={styles.statValue}>{props.currentSubscribers?.lapsed ?? 0}</div>
                  <div class={styles.statLabel}>Lapsed</div>
                </div>
              </div>
              <button class={styles.viewAllButton}>View all subscribers</button>
            </div>

            {/* Earnings Section */}
            <div class={styles.earningsSection}>
              <h3>Earnings (sats)</h3>
              <div class={styles.earningsGrid}>
                <div class={styles.earningItem}>
                  <span class={styles.earningLabel}>Subscriptions</span>
                  <span class={styles.earningValue}>
                    {props.currentEarnings?.subscriptions?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div class={styles.earningItem}>
                  <span class={styles.earningLabel}>PPV</span>
                  <span class={styles.earningValue}>
                    {props.currentEarnings?.ppv?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div class={styles.earningItem}>
                  <span class={styles.earningLabel}>Tips/Zaps</span>
                  <span class={styles.earningValue}>
                    {props.currentEarnings?.tips?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div class={styles.earningItem}>
                  <span class={styles.earningLabel}>Paid DMs</span>
                  <span class={styles.earningValue}>
                    {props.currentEarnings?.paidDMs?.toLocaleString() ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button class={styles.saveButton} onClick={handleSave} disabled={loading()}>
              {loading() ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SubscriptionModal;