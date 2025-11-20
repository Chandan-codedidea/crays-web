import { Component, createSignal, Show, onMount } from "solid-js";
import { useWallet } from "../contexts/WalletContext";
import styles from "./SendPaymentModal.module.scss";

type SendStep = "input" | "amount" | "confirm" | "processing" | "result";
type PaymentType =
  | "bolt11Invoice"
  | "bitcoinAddress"
  | "sparkAddress"
  | "lightningAddress"
  | "lnurlPay";

interface SendPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendPaymentModal: Component<SendPaymentModalProps> = (props) => {
  const wallet = useWallet();

  const [currentStep, setCurrentStep] = createSignal<SendStep>("input");
  const [paymentInput, setPaymentInput] = createSignal("");
  const [parsedInput, setParsedInput] = createSignal<any>(null);
  const [amount, setAmount] = createSignal("");
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [prepareResponse, setPrepareResponse] = createSignal<any>(null);
  const [paymentResult, setPaymentResult] = createSignal<
    "success" | "failure" | null
  >(null);

  // Reset state when modal opens
  onMount(() => {
    if (props.isOpen) {
      resetState();
    }
  });

  const resetState = () => {
    setCurrentStep("input");
    setPaymentInput("");
    setParsedInput(null);
    setAmount("");
    setError("");
    setIsLoading(false);
    setPrepareResponse(null);
    setPaymentResult(null);
  };

  // Parse payment input
  const processPaymentInput = async () => {
    const input = paymentInput().trim();

    if (!input) {
      setError("Please enter a payment destination");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use wallet.parseInput wrapper
      const parseResult = await wallet.parseInput(input);
      console.log("Parsed input:", parseResult);

      setParsedInput(parseResult);

      // Route based on input type
      if (parseResult.type === "bolt11Invoice") {
        if (parseResult.amountMsat && parseResult.amountMsat > 0) {
          const sats = Math.floor(parseResult.amountMsat / 1000);
          setAmount(String(sats));
          await prepareSendPayment(input, sats);
        } else {
          setCurrentStep("amount");
        }
      } else if (
        parseResult.type === "bitcoinAddress" ||
        parseResult.type === "sparkAddress"
      ) {
        setCurrentStep("amount");
      } else if (
        parseResult.type === "lightningAddress" ||
        parseResult.type === "lnurlPay"
      ) {
        setCurrentStep("amount");
      } else {
        setError("Invalid payment destination");
      }
    } catch (err: any) {
      console.error("Failed to parse input:", err);
      setError(err.message || "Invalid payment destination");
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare payment using wallet wrapper
  const prepareSendPayment = async (
    paymentRequest: string,
    amountSats: number
  ) => {
    if (amountSats <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Preparing payment:", { paymentRequest, amountSats });

      // Use wallet.prepareSendPayment wrapper with BigInt
      const response = await wallet.prepareSendPayment({
        paymentRequest,
        amount: BigInt(amountSats),
      });

      console.log("Prepare response:", response);
      setPrepareResponse(response);
      setCurrentStep("confirm");
    } catch (err: any) {
      console.error("Failed to prepare payment:", err);
      setError(err.message || "Failed to prepare payment");
    } finally {
      setIsLoading(false);
    }
  };

  // Send payment using wallet wrapper
  const handleSendPayment = async () => {
    const prepared = prepareResponse();
    if (!prepared) return;

    setCurrentStep("processing");
    setIsLoading(true);
    setError("");

    try {
      // Use wallet.sendPayment wrapper
      await wallet.sendPayment({ prepareResponse: prepared });

      console.log("Payment sent successfully");
      setPaymentResult("success");
    } catch (err: any) {
      console.error("Payment failed:", err);
      setError(err.message || "Payment failed");
      setPaymentResult("failure");
    } finally {
      setIsLoading(false);
      setCurrentStep("result");
    }
  };

  // Handle amount submission
  const handleAmountSubmit = async () => {
    const amountNum = parseInt(amount());

    if (!amountNum || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const input = paymentInput();
    console.log("Submitting amount:", amountNum, "for input:", input);

    await prepareSendPayment(input, amountNum);
  };


  const getPaymentTypeLabel = () => {
    const parsed = parsedInput();
    if (!parsed) return "";

    switch (parsed.type) {
      case "bolt11Invoice":
        return "Lightning Invoice";
      case "bitcoinAddress":
        return "Bitcoin Address";
      case "sparkAddress":
        return "Spark Address";
      case "lightningAddress":
        return "Lightning Address";
      case "lnurlPay":
        return "LNURL Pay";
      default:
        return "Payment";
    }
  };

  const handleClose = () => {
    resetState();
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      <div class={styles.modalOverlay} onClick={handleClose}>
        <div class={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
          <div class={styles.modalHandle}></div>

          <div class={styles.modalHeader}>
            <h2>
              {currentStep() === "input"
                ? "Send Payment"
                : getPaymentTypeLabel()}
            </h2>
            <button class={styles.closeButton} onClick={handleClose}>
              ×
            </button>
          </div>

          <div class={styles.modalContent}>
            {/* Step 1: Input */}
            <Show when={currentStep() === "input"}>
              <div class={styles.stepContainer}>
                <p class={styles.stepDescription}>
                  Enter Lightning invoice, Bitcoin address, or Lightning address
                </p>

                <textarea
                  class={styles.inputTextarea}
                  placeholder="lnbc..., bc1..., user@domain.com"
                  value={paymentInput()}
                  onInput={(e) => setPaymentInput(e.currentTarget.value)}
                  rows={4}
                />

                <Show when={error()}>
                  <p class={styles.errorText}>{error()}</p>
                </Show>

                <button
                  class={styles.primaryButton}
                  onClick={processPaymentInput}
                  disabled={!paymentInput() || isLoading()}
                >
                  {isLoading() ? "Processing..." : "Continue"}
                </button>
              </div>
            </Show>

            {/* Step 2: Amount */}
            <Show when={currentStep() === "amount"}>
              <div class={styles.stepContainer}>
                <p class={styles.stepDescription}>
                  How many sats do you want to send?
                </p>

                <div class={styles.amountInput}>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount()}
                    onInput={(e) => setAmount(e.currentTarget.value)}
                    class={styles.input}
                  />
                  <span class={styles.unit}>sats</span>
                </div>

                <Show when={error()}>
                  <p class={styles.errorText}>{error()}</p>
                </Show>

                <div class={styles.buttonGroup}>
                  <button
                    class={styles.secondaryButton}
                    onClick={() => setCurrentStep("input")}
                  >
                    Back
                  </button>
                  <button
                    class={styles.primaryButton}
                    onClick={handleAmountSubmit}
                    disabled={!amount() || isLoading()}
                  >
                    {isLoading() ? "Preparing..." : "Continue"}
                  </button>
                </div>
              </div>
            </Show>

            {/* Step 3: Confirm */}
            <Show when={currentStep() === "confirm"}>
              <div class={styles.stepContainer}>
                <h3 class={styles.confirmTitle}>Confirm Payment</h3>

                <div class={styles.confirmDetails}>
                  <div class={styles.detailRow}>
                    <span class={styles.detailLabel}>Amount:</span>
                    <span class={styles.detailValue}>{amount()} sats</span>
                  </div>

                  <Show when={prepareResponse()?.fee}>
                    <div class={styles.detailRow}>
                      <span class={styles.detailLabel}>Fee:</span>
                      <span class={styles.detailValue}>
                        {prepareResponse()?.fee} sats
                      </span>
                    </div>

                    <div class={styles.detailRow}>
                      <span class={styles.detailLabel}>Total:</span>
                      <span class={styles.detailValueBold}>
                        {parseInt(amount()) + (prepareResponse()?.fee || 0)}{" "}
                        sats
                      </span>
                    </div>
                  </Show>

                  <div class={styles.detailRow}>
                    <span class={styles.detailLabel}>To:</span>
                    <span class={styles.detailValueSmall}>
                      {paymentInput().substring(0, 20)}...
                    </span>
                  </div>
                </div>

                <Show when={error()}>
                  <p class={styles.errorText}>{error()}</p>
                </Show>

                <div class={styles.buttonGroup}>
                  <button
                    class={styles.secondaryButton}
                    onClick={() => setCurrentStep("amount")}
                  >
                    Back
                  </button>
                  <button
                    class={styles.primaryButton}
                    onClick={handleSendPayment}
                    disabled={isLoading()}
                  >
                    Send Payment
                  </button>
                </div>
              </div>
            </Show>

            {/* Step 4: Processing */}
            <Show when={currentStep() === "processing"}>
              <div class={styles.stepContainer}>
                <div class={styles.loadingContainer}>
                  <div class={styles.spinner}></div>
                  <p>Sending payment...</p>
                </div>
              </div>
            </Show>

            {/* Step 5: Result */}
            <Show when={currentStep() === "result"}>
              <div class={styles.stepContainer}>
                <Show when={paymentResult() === "success"}>
                  <div class={styles.successContainer}>
                    <div class={styles.successIcon}>✓</div>
                    <h3>Payment Sent!</h3>
                    <p>Your payment of {amount()} sats was sent successfully</p>
                  </div>
                </Show>

                <Show when={paymentResult() === "failure"}>
                  <div class={styles.errorContainer}>
                    <div class={styles.errorIcon}>✗</div>
                    <h3>Payment Failed</h3>
                    <p>{error() || "An error occurred"}</p>
                  </div>
                </Show>

                <button class={styles.primaryButton} onClick={handleClose}>
                  Close
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SendPaymentModal;
