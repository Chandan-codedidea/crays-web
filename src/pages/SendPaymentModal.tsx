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
  // const [prepareResponse, setPrepareResponse] = createSignal<any>(null);
  const [prepareResponse, setPrepareResponse] = createSignal<{
    response: any;
    paymentType: "lnurl" | "regular";
  } | null>(null);

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
      const parseResult = await wallet.parseInput(input);
      console.log("Parsed input:", parseResult);

      setParsedInput(parseResult);

      switch (parseResult.type) {
        case "bolt11":
          // BOLT11 invoice
          if (
            parseResult.invoice?.amountMsat &&
            parseResult.invoice.amountMsat > 0
          ) {
            const sats = Math.floor(parseResult.invoice.amountMsat / 1000);
            setAmount(String(sats));
            await prepareSendPayment(input, sats);
          } else {
            setCurrentStep("amount");
          }
          break;

        case "lightningAddress":
          // Lightning address like user@domain.com
          console.log(
            "Lightning address detected:",
            parseResult.address || input
          );
          setCurrentStep("amount");
          break;

        case "lnUrlPay":
          // LNURL-pay
          if (parseResult.data?.minSendable && parseResult.data?.maxSendable) {
            const minSats = Math.floor(parseResult.data.minSendable / 1000);
            const maxSats = Math.floor(parseResult.data.maxSendable / 1000);
            console.log(
              `LNURL-pay: Can send between ${minSats} and ${maxSats} sats`
            );
          }
          setCurrentStep("amount");
          break;

        case "bitcoinAddress":
          // On-chain Bitcoin address
          console.log("Bitcoin address detected:", parseResult.address);
          setCurrentStep("amount");
          break;

        case "lnUrlWithdraw":
          // LNURL-withdraw
          console.log("LNURL-withdraw detected");
          setError("LNURL-withdraw is for receiving, not sending payments");
          break;

        case "nodeId":
          setError(
            "Node ID detected. Please provide a Lightning invoice or address."
          );
          break;

        case "url":
          setError(
            "URL detected. Please provide a valid Lightning payment destination."
          );
          break;

        default:
          setError(`Unsupported payment type: ${parseResult.type}`);
          console.error("Unknown type:", parseResult.type, parseResult);
      }
    } catch (err: any) {
      console.error("Failed to parse input:", err);
      setError(err.message || "Invalid payment destination");
    } finally {
      setIsLoading(false);
    }
  };

  const prepareSendPayment = async (
    paymentRequest: string,
    amountSats: number
  ) => {
    if (
      !paymentRequest ||
      typeof paymentRequest !== "string" ||
      paymentRequest.trim() === ""
    ) {
      setError("Payment request is required and must be a valid string");
      return;
    }

    if (amountSats <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Preparing payment:", {
        paymentRequest,
        amountSats,
        requestType: typeof paymentRequest,
        requestLength: paymentRequest.length,
      });

      // Parse the input to detect type
      const parsed = await wallet.parseInput(paymentRequest.trim());

      console.log("Parsed input:", parsed);

      let response;
      let paymentType: "lnurl" | "regular";

      // Handle Lightning Address
      if (parsed.type === "lightningAddress") {
        console.log("Detected Lightning Address");

        response = await wallet.prepareLnurlPay({
          amountSats: amountSats,
          payRequest: parsed.payRequest,
          comment: undefined,
          validateSuccessActionUrl: true,
        });

        paymentType = "lnurl";
        console.log("Lightning Address payment prepared:", response);
      }
      // Handle lnUrlPay type
      else if (parsed.type === "lnUrlPay") {
        console.log("Detected LNURL-Pay");

        response = await wallet.prepareLnurlPay({
          amountSats: amountSats,
          payRequest: parsed.data,
          comment: undefined,
          validateSuccessActionUrl: true,
        });

        paymentType = "lnurl";
        console.log("LNURL-Pay prepared:", response);
      }
      // Handle regular bolt11 invoice
      else if (parsed.type === "bolt11") {
        console.log("Detected Bolt11 invoice");

        response = await wallet.prepareSendPayment({
          paymentRequest: paymentRequest.trim(),
          amount: BigInt(amountSats),
        });

        paymentType = "regular";
        console.log("Regular payment prepared:", response);
      } else {
        setError(`Unsupported payment type: ${parsed.type}`);
        return;
      }

      // ✅ Check actual fee from the prepared response
      console.log("Payment prepared successfully:", response);

      if (response.feeSats !== undefined) {
        const totalNeeded = amountSats + response.feeSats;

        // Get current balance
        const info = await wallet.getWalletInfo();
        const balanceSats = info.balanceSats || 0;

        console.log(
          `Fee: ${response.feeSats} sats, Total needed: ${totalNeeded} sats, Balance: ${balanceSats} sats`
        );

        if (balanceSats < totalNeeded) {
          setError(
            `Insufficient funds. Need ${totalNeeded} sats (${amountSats} payment + ${response.feeSats} fee), but only have ${balanceSats} sats`
          );
          setIsLoading(false);
          return;
        }
      }

      // Store both response and payment type
      setPrepareResponse({ response, paymentType });
      setCurrentStep("confirm");
    } catch (err: any) {
      console.error("Failed to prepare payment:", err);
      setError(err.message || "Failed to prepare payment");
    } finally {
      setIsLoading(false);
    }
  };

  // Send payment using the correct method
  const handleSendPayment = async () => {
    const prepared = prepareResponse();
    if (!prepared) return;

    setCurrentStep("processing");
    setIsLoading(true);
    setError("");

    try {
      let result;

      if (prepared.paymentType === "lnurl") {
        // Use lnurlPay for Lightning addresses
        result = await wallet.lnurlPay({
          prepareResponse: prepared.response,
        });
        console.log("LNURL Payment sent:", result);
      } else {
        // Use sendPayment for bolt11
        result = await wallet.sendPayment({
          prepareResponse: prepared.response,
        });
        console.log("Regular payment sent:", result);
      }

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

  const handleAmountSubmit = async () => {
    const amountNum = parseInt(amount());

    if (!amountNum || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Check wallet balance first
    try {
      const info = await wallet.getWalletInfo();
      const balanceSats = info.balanceSats || 0;

      console.log("Wallet balance:", balanceSats, "sats");

      // ✅ Just check if we have more than the payment amount
      // The actual fee check will happen after preparing
      if (balanceSats < amountNum) {
        setError(
          `Insufficient funds. Balance: ${balanceSats} sats, need at least ${amountNum} sats`
        );
        return;
      }
    } catch (err) {
      console.error("Failed to check balance:", err);
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
