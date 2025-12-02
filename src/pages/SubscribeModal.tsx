import { Component, createSignal, For, Show } from "solid-js";
import styles from "./SubscribeModal.module.scss";
import { useWallet } from "../contexts/WalletContext";
import { getSubscriptionInvoice } from "../lib/getSubscriptionInvoice";
import { publishSubscriptionReceipt } from "../lib/nostrSubscriptions";

interface BundleConfig {
  months: number;
  discountPercent: number;
  totalSats: number;
}

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyPrice: number;
  bundles: BundleConfig[];
  targetPubkey: string;
}

const SubscribeModal: Component<SubscribeModalProps> = (props) => {
  const oneMonthTotal = props.monthlyPrice;
  const [selectedOption, setSelectedOption] = createSignal<
    "1" | "3" | "6" | "12"
  >("1");
  const wallet = useWallet();

  const bundleOptions = [
    {
      months: 1,
      label: "1 Month",
      total: oneMonthTotal,
      discount: 0,
    },
    ...props.bundles.map((b) => ({
      months: b.months,
      label: `${b.months} Months`,
      total: b.totalSats,
      discount: b.discountPercent,
    })),
  ];

  const selectedBundle = () =>
    bundleOptions.find((opt) => String(opt.months) === selectedOption()) ||
    bundleOptions[0];

  const handleSubscribe = async () => {
    const bundle = selectedBundle();
    const months = bundle.months;
    const amount = bundle.total; // in sats
    const targetPubkey = props.targetPubkey;

    try {
      const paymentRequest = await getSubscriptionInvoice(
        targetPubkey,
        months,
        props.monthlyPrice
      );

      if (!paymentRequest) throw new Error("Failed to get payment invoice");

      // Pay using Breez wallet context!
      const prepared = await wallet.prepareSendPayment({
        paymentRequest,
        amount: BigInt(amount),
      });
      const payment = await wallet.sendPayment({ prepareResponse: prepared });

      // After payment, publish subscription receipt event to Nostr (see previous messages)!
      await publishSubscriptionReceipt(
        props.targetPubkey,
        selectedBundle().months,
        selectedBundle().total,
        payment.payment
      );

      alert(
        `Subscription successful! Paid ${amount} sats for ${months} months.`
      );
      props.onClose();
    } catch (err: any) {
      alert(`Payment failed: ${err.message || err}`);
      console.error(err);
    }
  };

  return (
    <Show when={props.isOpen}>
      <div class={styles.modalOverlay} onClick={props.onClose}>
        <div class={styles.subscribeModal} onClick={(e) => e.stopPropagation()}>
          <div class={styles.modalHeader}>
            <h2>Choose Subscription</h2>
            <button
              class={styles.closeButton}
              onClick={props.onClose}
              aria-label="Close"
            >
              &#x2715; {/* Unicode X or use an SVG */}
            </button>
          </div>
          <p class={styles.priceInfo}>
            Monthly price: <b>{props.monthlyPrice.toLocaleString()}</b> sats
          </p>
          <div class={styles.optionsList}>
            <For each={bundleOptions}>
              {(option) => (
                <label
                  class={`${styles.optionCard} ${
                    selectedOption() === String(option.months)
                      ? styles.selected
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="subscriptionOption"
                    value={option.months}
                    checked={selectedOption() === String(option.months)}
                    onChange={() => setSelectedOption(String(option.months))}
                    style={{ display: "none" }}
                  />
                  <div>
                    <span class={styles.optionLabel}>{option.label}</span>
                    <span class={styles.optionTotal}>
                      {option.total.toLocaleString()} sats
                    </span>
                    <Show when={option.discount > 0}>
                      <span class={styles.optionDiscount}>
                        {option.discount}% off
                      </span>
                    </Show>
                  </div>
                </label>
              )}
            </For>
          </div>
          <button class={styles.confirmButton} onClick={handleSubscribe}>
            Subscribe for {selectedBundle().total.toLocaleString()} sats
          </button>
        </div>
      </div>
    </Show>
  );
};

export default SubscribeModal;
