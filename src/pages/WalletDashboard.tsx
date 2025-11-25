import {
  Component,
  createSignal,
  onMount,
  onCleanup,
  Show,
  For,
  createEffect,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import styles from "./WalletDashboard.module.scss";
import { useWallet } from "../contexts/WalletContext";
import { useProfileContext } from "../contexts/ProfileContext";
import { userName } from "../stores/profile";
import qrcode from "qrcode-generator";
import SendPaymentModal from "./SendPaymentModal";
import PageTitle from "../components/PageTitle/PageTitle";
import { useIntl } from "@cookbook/solid-intl";
import { wallets as t } from "../translations";
type PaymentMethod = "lightning" | "bitcoin";

const WalletDashboard: Component = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const wallet = useWallet();
  const profile = useProfileContext();

  const [balance, setBalance] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(true);
  const [nodeInfo, setNodeInfo] = createSignal<any>(null);
  const [recentPayments, setRecentPayments] = createSignal([]);
  const [error, setError] = createSignal("");
  const [refreshing, setRefreshing] = createSignal(false);

  // Receive Modal States
  const [showReceiveModal, setShowReceiveModal] = createSignal(false);
  const [showSendModal, setShowSendModal] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<PaymentMethod>("bitcoin");

  // Lightning Address States
  const [lightningAddress, setLightningAddress] = createSignal("");
  const [lightningLoading, setLightningLoading] = createSignal(false);
  const [lightningError, setLightningError] = createSignal("");
  const [isEditingLightning, setIsEditingLightning] = createSignal(false);
  const [lightningUsername, setLightningUsername] = createSignal("");
  const [suggestedUsernames, setSuggestedUsernames] = createSignal<string[]>(
    []
  );

  // Bitcoin Address States
  const [bitcoinAddress, setBitcoinAddress] = createSignal("");
  const [bitcoinLoading, setBitcoinLoading] = createSignal(false);

  // QR Codes
  const [lightningQR, setLightningQR] = createSignal("");
  const [bitcoinQR, setBitcoinQR] = createSignal("");
  const [copySuccess, setCopySuccess] = createSignal("");
  const [selectedPayment, setSelectedPayment] = createSignal(null);

  // Generate QR codes when addresses change
  createEffect(() => {
    if (lightningAddress()) {
      const qr = qrcode(0, "M");
      qr.addData(lightningAddress());
      qr.make();
      setLightningQR(qr.createDataURL(8, 4));
    }
  });

  createEffect(() => {
    if (bitcoinAddress()) {
      const qr = qrcode(0, "M");
      qr.addData(bitcoinAddress());
      qr.make();
      setBitcoinQR(qr.createDataURL(8, 4));
    }
  });

  const fetchWalletData = async () => {
    try {
      setRefreshing(true);

      const info = await wallet.getWalletInfo();

      setNodeInfo(info);
      const balanceSats = info.balanceSats || 0;
      setBalance(balanceSats);

      const paymentsResponse = await wallet.getTransactions();

      const paymentsArray = Array.isArray(paymentsResponse)
        ? paymentsResponse
        : paymentsResponse?.payments || [];


      setRecentPayments(paymentsArray.slice(0, 10));

      setError("");
    } catch (err: any) {
      console.error("Failed to fetch wallet data:", err);
      setError(err.message || "Failed to load wallet data");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Check if Lightning address username is available
  const checkAvailability = async (username: string): Promise<boolean> => {
    const sdkInstance = wallet.getSdkInstance();
    if (!sdkInstance) return false;

    try {
      // Pass as object with 'username' property
      const isAvailable = await sdkInstance.checkLightningAddressAvailable?.({
        username: username,
      });
      return isAvailable !== false;
    } catch (e) {
      console.warn("checkLightningAddressAvailable not available:", e);
      return true; // Assume available if check fails
    }
  };

  // Generate username suggestions
  const generateSuggestions = (baseUsername: string): string[] => {
    return [
      `${baseUsername}${Math.floor(Math.random() * 999)}`,
      `${baseUsername}_btc`,
      `${baseUsername}_ln`,
      `${baseUsername}_${new Date().getFullYear()}`,
    ];
  };

  // Register Lightning Address with availability check
  const registerLightningAddress = async (username: string) => {
    setLightningLoading(true);
    setLightningError("");
    const sdkInstance = wallet.getSdkInstance();

    if (!sdkInstance) {
      setLightningError("Wallet not initialized");
      setLightningLoading(false);
      return;
    }

    try {
      // Clean username ONCE
      const cleanUsername = username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (!cleanUsername || cleanUsername.length < 3) {
        setLightningError("Username must be at least 3 characters");
        setLightningLoading(false);
        return;
      }

      console.log("Checking availability for:", cleanUsername);

      // Check availability first
      const isAvailable = await checkAvailability(cleanUsername);

      if (!isAvailable) {
        setLightningError(`"${cleanUsername}" is already taken`);
        // Generate and show suggestions
        const suggestions = generateSuggestions(cleanUsername);
        setSuggestedUsernames(suggestions);
        setLightningLoading(false);
        return;
      }

      // Register the address
      console.log("Registering Lightning address:", cleanUsername);
      await sdkInstance.registerLightningAddress({
        username: cleanUsername,
      });

      // Verify registration
      const registered = await sdkInstance.getLightningAddress();
      console.log("Successfully registered:", registered);

      if (registered) {
        const addressString =
          typeof registered === "string"
            ? registered
            : registered.lightningAddress;

        setLightningAddress(addressString);
        setIsEditingLightning(false);
        setLightningError("");
        setSuggestedUsernames([]);
      }
    } catch (err: any) {
      console.error("Failed to register Lightning address:", err);

      if (
        err.message?.includes("already exists") ||
        err.message?.includes("taken")
      ) {
        setLightningError("This username is already taken");
        const cleanUsername = username
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const suggestions = generateSuggestions(cleanUsername);
        setSuggestedUsernames(suggestions);
      } else {
        setLightningError(err.message || "Failed to register address");
      }
    } finally {
      setLightningLoading(false);
    }
  };

  // Load existing Lightning Address or prompt to create
  const loadLightningAddress = async () => {
    if (lightningAddress() || lightningLoading()) return;

    setLightningLoading(true);
    const sdkInstance = wallet.getSdkInstance();

    if (!sdkInstance) {
      setLightningLoading(false);
      return;
    }

    try {
      // Try to get existing Lightning address
      const existing = await sdkInstance.getLightningAddress();
      console.log(existing);

      if (existing) {
        const addressString =
          typeof existing === "string" ? existing : existing.lightningAddress;

        setLightningAddress(addressString);
        console.log("Existing Lightning address loaded:", addressString);
      } else {
        // No address exists, prepare to create one
        console.log("No Lightning address found, prompting user to create");

        // Pre-fill with Nostr username
        const userProfile = profile?.profileHistory?.profiles?.[0];
        const nostrUsername =
          userProfile?.name ||
          userProfile?.display_name ||
          userProfile?.displayName;

        if (nostrUsername) {
          // Clean username properly
          const cleanUsername = nostrUsername
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

          if (cleanUsername && cleanUsername.length >= 3) {
            setLightningUsername(cleanUsername);

            // Check if Nostr username is available
            console.log(
              "Checking availability for Nostr username:",
              cleanUsername
            );
            const isAvailable = await checkAvailability(cleanUsername);

            if (!isAvailable) {
              console.log("Nostr username taken, showing suggestions");
              setSuggestedUsernames(generateSuggestions(cleanUsername));
            }
          } else {
            console.log("Nostr username too short or invalid");
          }
        }

        setIsEditingLightning(true);
      }
    } catch (e) {
      console.error("Error loading Lightning address:", e);
      setIsEditingLightning(true);
    } finally {
      setLightningLoading(false);
    }
  };

  // Generate Bitcoin Address
  const generateBitcoinAddress = async () => {
    if (bitcoinAddress() || bitcoinLoading()) return;

    setBitcoinLoading(true);
    const sdkInstance = wallet.getSdkInstance();

    if (!sdkInstance) {
      setBitcoinLoading(false);
      return;
    }

    try {
      const btcResponse = await sdkInstance.receivePayment({
        paymentMethod: { type: "bitcoinAddress" },
      });

      if (btcResponse.paymentRequest) {
        setBitcoinAddress(btcResponse.paymentRequest);
        console.log("Bitcoin address generated:", btcResponse.paymentRequest);
      }
    } catch (e) {
      console.error("Failed to generate Bitcoin address:", e);
    } finally {
      setBitcoinLoading(false);
    }
  };

  const handleReceiveClick = () => {
    setShowReceiveModal(true);

    // Generate addresses based on active tab
    if (activeTab() === "lightning") {
      loadLightningAddress();
    } else if (activeTab() === "bitcoin") {
      generateBitcoinAddress();
    }
  };

  const handleTabChange = (tab: PaymentMethod) => {
    setActiveTab(tab);

    // Generate address for selected tab if not already generated
    if (tab === "lightning" && !lightningAddress() && !isEditingLightning()) {
      loadLightningAddress();
    } else if (tab === "bitcoin" && !bitcoinAddress()) {
      generateBitcoinAddress();
    }
  };

  const resetModalState = () => {
    setLightningAddress("");
    setBitcoinAddress("");
    setLightningLoading(false);
    setBitcoinLoading(false);
    setIsEditingLightning(false);
    setLightningUsername("");
    setLightningError("");
    setSuggestedUsernames([]);
    setCopySuccess("");
  };

  const handleCloseModal = () => {
    setShowReceiveModal(false);
    setTimeout(() => resetModalState(), 300);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 30) return address;
    return `${address.slice(0, 15)}...${address.slice(-15)}`;
  };

  let refreshInterval: number;

  // onMount(async () => {
  //   const savedMnemonic = wallet.getSavedMnemonic();

  //   if (!savedMnemonic) {
  //     navigate("/wallet");
  //     return;
  //   }

  //   if (!wallet.connected()) {
  //     try {
  //       console.log("Reconnecting wallet...");
  //       const sdk = await import("@breeztech/breez-sdk-spark");
  //       await sdk.default();

  //       const breezApiKey = import.meta.env.PRIMAL_BREEZ_API_KEY;
  //       const config = sdk.defaultConfig("mainnet");
  //       config.apiKey = breezApiKey;
  //       config.lnurl_domain = "pay.crays.net";

  //       await wallet.initWallet(savedMnemonic, config);
  //       console.log("Wallet reconnected");
  //     } catch (error) {
  //       console.error("Failed to reconnect:", error);
  //       setError("Failed to connect wallet. Please try again.");
  //       setIsLoading(false);
  //       return;
  //     }
  //   }

  //   fetchWalletData();
  //   refreshInterval = setInterval(fetchWalletData, 30000);
  // });

  onMount(async () => {
  const savedMnemonic = wallet.getSavedMnemonic();

  if (!savedMnemonic) {
    navigate("/wallet");
    return;
  }

  // ✅ Use centralized ensureConnected
  try {
    await wallet.ensureConnected();
    console.log("Wallet connected");
  } catch (error) {
    console.error("Failed to connect:", error);
    setError("Failed to connect wallet. Please try again.");
    setIsLoading(false);
    return;
  }

  fetchWalletData();
  refreshInterval = setInterval(fetchWalletData, 30000);
});


  onCleanup(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  const formatSats = (sats: number) => {
    return new Intl.NumberFormat().format(Math.floor(sats));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = async () => {
    try {
      await wallet.disconnect();
      wallet.clearMnemonic();
      navigate("/wallet");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div class={styles.dashboardContainer}>
      <PageTitle title={intl.formatMessage(t.title)} />
      <div class={styles.header}>
        <h1 class={styles.title}>Lightning Wallet</h1>
        <button class={styles.logoutButton} onClick={handleLogout}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"
              fill="currentColor"
            />
          </svg>
          Logout
        </button>
      </div>

      <Show when={isLoading()}>
        <div class={styles.loadingContainer}>
          <div class={styles.spinner}></div>
          <p>Loading wallet data...</p>
        </div>
      </Show>

      <Show when={!isLoading() && error()}>
        <div class={styles.errorContainer}>
          <p>{error()}</p>
          <button onClick={() => fetchWalletData()}>Retry</button>
        </div>
      </Show>

      <Show when={!isLoading() && !error()}>
        <div class={styles.content}>
          {/* Balance Card */}
          <div class={styles.balanceCard}>
            <p class={styles.balanceLabel}>Total Balance</p>
            <h2 class={styles.balanceAmount}>
              {formatSats(balance())} <span>sats</span>
            </h2>

            <div class={styles.balanceActions}>
              <button class={styles.actionButton} onClick={handleReceiveClick}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                </svg>
                Receive
              </button>
              <button
                class={styles.actionButton}
                onClick={() => setShowSendModal(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z"
                    fill="currentColor"
                  />
                </svg>
                Send
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div class={styles.transactionsSection}>
            <div class={styles.sectionHeader}>
              <h3>Recent Transactions</h3>
              <button
                class={styles.refreshButton}
                onClick={() => fetchWalletData()}
                disabled={refreshing()}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"
                    fill="currentColor"
                  />
                </svg>
                {refreshing() ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <Show when={recentPayments().length === 0}>
              <div class={styles.emptyState}>
                <p>No transactions yet</p>
              </div>
            </Show>

            <Show when={recentPayments().length > 0}>
              <div class={styles.transactionsList}>
                <For each={recentPayments()}>
                  {(payment) => (
                    <div
                      class={styles.transactionItem}
                      onClick={() => setSelectedPayment(payment)}
                      style="cursor: pointer;"
                    >
                      <div class={styles.transactionIcon}>
                        <Show when={payment.paymentType === "send"}>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z"
                              fill="currentColor"
                            />
                          </svg>
                        </Show>
                        <Show when={payment.paymentType === "receive"}>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 12L18.59 10.59L13 16.17V4H11V16.17L5.42 10.58L4 12L12 20L20 12Z"
                              fill="currentColor"
                            />
                          </svg>
                        </Show>
                      </div>
                      <div class={styles.transactionDetails}>
                        <p class={styles.transactionType}>
                          {payment.paymentType === "send" ? "Sent" : "Received"}
                        </p>
                        <p class={styles.transactionDate}>
                          {formatDate(payment.timestamp)}
                        </p>
                      </div>
                      <div class={styles.transactionAmount}>
                        <span
                          class={
                            payment.paymentType === "send"
                              ? styles.negative
                              : styles.positive
                          }
                        >
                          {payment.paymentType === "send" ? "-" : "+"}
                          {formatSats(Number(payment.amount))} sats
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            {/* Payment Details Modal - New Classes */}
            <Show when={selectedPayment()}>
              <div
                class={styles.txnOverlay}
                onClick={() => setSelectedPayment(null)}
              >
                <div
                  class={styles.txnModal}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div class={styles.txnHeader}>
                    <button
                      onClick={() => setSelectedPayment(null)}
                      class={styles.txnClose}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Amount Hero Section */}
                  <div class={styles.txnHero}>
                    <div
                      class={
                        selectedPayment().paymentType === "send"
                          ? styles.txnIconSend
                          : styles.txnIconReceive
                      }
                    >
                      <Show when={selectedPayment().paymentType === "send"}>
                        ↑
                      </Show>
                      <Show when={selectedPayment().paymentType === "receive"}>
                        ↓
                      </Show>
                    </div>

                    <h2
                      class={
                        selectedPayment().paymentType === "send"
                          ? styles.txnAmountSend
                          : styles.txnAmountReceive
                      }
                    >
                      {selectedPayment().paymentType === "send" ? "-" : "+"}
                      {formatSats(Number(selectedPayment().amount))}
                      <span class={styles.txnUnit}>sats</span>
                    </h2>

                    <p class={styles.txnStatusBadge}>
                      {selectedPayment().status.toUpperCase()}
                    </p>
                  </div>

                  {/* Info Cards Grid */}
                  <div class={styles.txnInfoGrid}>
                    <div class={styles.txnInfoCard}>
                      <span class={styles.txnInfoLabel}>Date</span>
                      <span class={styles.txnInfoValue}>
                        {formatDate(selectedPayment().timestamp)}
                      </span>
                    </div>
                    <div class={styles.txnInfoCard}>
                      <span class={styles.txnInfoLabel}>Method</span>
                      <span class={styles.txnInfoValue}>
                        {selectedPayment().method}
                      </span>
                    </div>
                    <div class={styles.txnInfoCard}>
                      <span class={styles.txnInfoLabel}>Fees</span>
                      <span class={styles.txnInfoValue}>
                        {selectedPayment().fees} sats
                      </span>
                    </div>
                  </div>

                  {/* Copyable Details */}
                  <div class={styles.txnDetailsList}>
                    <div class={styles.txnCopyRow}>
                      <div class={styles.txnCopyInfo}>
                        <span class={styles.txnCopyLabel}>Transaction ID</span>
                        <span class={styles.txnCopyText}>
                          {truncateAddress(selectedPayment().id)}
                        </span>
                      </div>
                      <button
                        class={styles.txnCopyBtn}
                        onClick={() =>
                          copyToClipboard(selectedPayment().id, "id")
                        }
                      >
                        {copySuccess() === "id" ? "✓" : "📋"}
                      </button>
                    </div>

                    <Show when={selectedPayment().details}>
                      <div class={styles.txnCopyRow}>
                        <div class={styles.txnCopyInfo}>
                          <span class={styles.txnCopyLabel}>Payment Hash</span>
                          <span class={styles.txnCopyText}>
                            {truncateAddress(
                              selectedPayment().details.paymentHash
                            )}
                          </span>
                        </div>
                        <button
                          class={styles.txnCopyBtn}
                          onClick={() =>
                            copyToClipboard(
                              selectedPayment().details.paymentHash,
                              "hash"
                            )
                          }
                        >
                          {copySuccess() === "hash" ? "✓" : "📋"}
                        </button>
                      </div>

                      <Show when={selectedPayment().details.preimage}>
                        <div class={styles.txnCopyRow}>
                          <div class={styles.txnCopyInfo}>
                            <span class={styles.txnCopyLabel}>Preimage</span>
                            <span class={styles.txnCopyText}>
                              {truncateAddress(
                                selectedPayment().details.preimage
                              )}
                            </span>
                          </div>
                          <button
                            class={styles.txnCopyBtn}
                            onClick={() =>
                              copyToClipboard(
                                selectedPayment().details.preimage,
                                "preimage"
                              )
                            }
                          >
                            {copySuccess() === "preimage" ? "✓" : "📋"}
                          </button>
                        </div>
                      </Show>

                      <Show when={selectedPayment().details.invoice}>
                        <div class={styles.txnCopyRow}>
                          <div class={styles.txnCopyInfo}>
                            <span class={styles.txnCopyLabel}>Invoice</span>
                            <span class={styles.txnCopyText}>
                              {truncateAddress(
                                selectedPayment().details.invoice
                              )}
                            </span>
                          </div>
                          <button
                            class={styles.txnCopyBtn}
                            onClick={() =>
                              copyToClipboard(
                                selectedPayment().details.invoice,
                                "invoice"
                              )
                            }
                          >
                            {copySuccess() === "invoice" ? "✓" : "📋"}
                          </button>
                        </div>
                      </Show>

                      <Show when={selectedPayment().details.destinationPubkey}>
                        <div class={styles.txnCopyRow}>
                          <div class={styles.txnCopyInfo}>
                            <span class={styles.txnCopyLabel}>Node Pubkey</span>
                            <span class={styles.txnCopyText}>
                              {truncateAddress(
                                selectedPayment().details.destinationPubkey
                              )}
                            </span>
                          </div>
                          <button
                            class={styles.txnCopyBtn}
                            onClick={() =>
                              copyToClipboard(
                                selectedPayment().details.destinationPubkey,
                                "pubkey"
                              )
                            }
                          >
                            {copySuccess() === "pubkey" ? "✓" : "📋"}
                          </button>
                        </div>
                      </Show>
                    </Show>
                  </div>

                  {/* Explorer Links */}
                  <div class={styles.txnLinks}>
                    <a
                      href="https://mempool.space/lightning"
                      target="_blank"
                      rel="noopener noreferrer"
                      class={styles.txnExplorerLink}
                    >
                      <span>View on Mempool</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M6 3H3V13H13V10M10 3H14M14 3V7M14 3L7 10"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                      </svg>
                    </a>
                    <Show when={selectedPayment().details?.paymentHash}>
                      <a
                        href={`https://1ml.com/search?q=${
                          selectedPayment().details.paymentHash
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class={styles.txnExplorerLink}
                      >
                        <span>Search on 1ML</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M6 3H3V13H13V10M10 3H14M14 3V7M14 3L7 10"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                          />
                        </svg>
                      </a>
                    </Show>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      <SendPaymentModal
        isOpen={showSendModal()}
        onClose={() => setShowSendModal(false)}
      />

      {/* Receive Modal */}
      <Show when={showReceiveModal()}>
        <div class={styles.modalOverlay} onClick={handleCloseModal}>
          <div class={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div class={styles.modalHandle}></div>

            <div class={styles.modalHeader}>
              <h2>Receive Payment</h2>
              <button class={styles.closeButton} onClick={handleCloseModal}>
                ×
              </button>
            </div>

            {/* Tab Buttons */}
            <div class={styles.tabButtons}>
              <button
                class={
                  activeTab() === "lightning" ? styles.tabActive : styles.tab
                }
                onClick={() => handleTabChange("lightning")}
              >
                ⚡ Lightning
              </button>
              <button
                class={
                  activeTab() === "bitcoin" ? styles.tabActive : styles.tab
                }
                onClick={() => handleTabChange("bitcoin")}
              >
                ₿ Bitcoin
              </button>
            </div>

            {/* Content */}
            <div class={styles.modalContent}>
              {/* Lightning Tab */}
              <Show when={activeTab() === "lightning"}>
                <Show when={lightningLoading()}>
                  <div class={styles.loadingAddresses}>
                    <div class={styles.spinner}></div>
                    <p>Loading Lightning address...</p>
                  </div>
                </Show>

                {/* Lightning Address Creation/Edit Form */}
                <Show when={isEditingLightning() && !lightningLoading()}>
                  <div class={styles.addressSection}>
                    <h3 class={styles.sectionTitle}>
                      {lightningAddress()
                        ? "Edit Lightning Address"
                        : "Create Lightning Address"}
                    </h3>
                    <p class={styles.addressDescription}>
                      Choose a username for your Lightning address
                    </p>

                    <div class={styles.inputGroup}>
                      <input
                        type="text"
                        value={lightningUsername()}
                        onInput={(e) =>
                          setLightningUsername(e.currentTarget.value)
                        }
                        placeholder="username"
                        class={styles.input}
                        disabled={lightningLoading()}
                      />
                      {/* <span class={styles.inputSuffix}>@breez.tips</span> */}
                    </div>

                    <Show when={lightningError()}>
                      <p class={styles.errorText}>{lightningError()}</p>
                    </Show>

                    {/* Username Suggestions */}
                    <Show when={suggestedUsernames().length > 0}>
                      <div class={styles.suggestions}>
                        <p class={styles.suggestionsLabel}>
                          Try these instead:
                        </p>
                        <div class={styles.suggestionsList}>
                          <For each={suggestedUsernames()}>
                            {(suggestion) => (
                              <button
                                class={styles.suggestionChip}
                                onClick={() => setLightningUsername(suggestion)}
                              >
                                {suggestion}
                              </button>
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>

                    <div class={styles.buttonGroup}>
                      <button
                        class={styles.secondaryButton}
                        onClick={() => {
                          setIsEditingLightning(false);
                          setSuggestedUsernames([]);
                          setLightningError("");
                        }}
                        disabled={lightningLoading()}
                      >
                        Cancel
                      </button>
                      <button
                        class={styles.copyButton}
                        onClick={() =>
                          registerLightningAddress(lightningUsername())
                        }
                        disabled={!lightningUsername() || lightningLoading()}
                      >
                        {lightningLoading() ? "Creating..." : "Create Address"}
                      </button>
                    </div>
                  </div>
                </Show>

                {/* Lightning Address Display */}
                <Show
                  when={
                    !lightningLoading() &&
                    !isEditingLightning() &&
                    lightningAddress()
                  }
                >
                  <div class={styles.addressSection}>
                    <div class={styles.qrContainer}>
                      <img
                        src={lightningQR()}
                        alt="Lightning QR"
                        class={styles.qrCode}
                      />
                    </div>
                    <p class={styles.addressDescription}>
                      Scan to pay or share this Lightning address
                    </p>
                    <div class={styles.addressBox}>
                      <code class={styles.address}>{lightningAddress()}</code>
                      <button
                        class={styles.editIconButton}
                        onClick={() => {
                          setIsEditingLightning(true);
                          const username = lightningAddress().split("@")[0];
                          setLightningUsername(username);
                        }}
                        title="Edit Lightning address"
                      >
                        ✏️
                      </button>
                    </div>
                    <button
                      class={styles.copyButton}
                      onClick={() =>
                        copyToClipboard(lightningAddress(), "lightning")
                      }
                    >
                      {copySuccess() === "lightning"
                        ? "✓ Copied!"
                        : "Copy Address"}
                    </button>
                  </div>
                </Show>
              </Show>

              {/* Bitcoin Tab */}
              <Show when={activeTab() === "bitcoin"}>
                <Show when={bitcoinLoading()}>
                  <div class={styles.loadingAddresses}>
                    <div class={styles.spinner}></div>
                    <p>Generating Bitcoin address...</p>
                  </div>
                </Show>

                <Show when={!bitcoinLoading() && bitcoinAddress()}>
                  <div class={styles.addressSection}>
                    <div class={styles.qrContainer}>
                      <img
                        src={bitcoinQR()}
                        alt="Bitcoin QR"
                        class={styles.qrCode}
                      />
                    </div>
                    <p class={styles.addressDescription}>
                      Send Bitcoin to this address for automatic Lightning
                      conversion
                    </p>
                    <div class={styles.addressBox}>
                      <code class={styles.address}>{bitcoinAddress()}</code>
                    </div>
                    <button
                      class={styles.copyButton}
                      onClick={() =>
                        copyToClipboard(bitcoinAddress(), "bitcoin")
                      }
                    >
                      {copySuccess() === "bitcoin"
                        ? "✓ Copied!"
                        : "Copy Address"}
                    </button>
                  </div>
                </Show>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default WalletDashboard;
