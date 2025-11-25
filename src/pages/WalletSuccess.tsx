import { Component, createSignal, onMount } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import styles from "./WalletSuccess.module.scss";
import { useWallet } from "../contexts/WalletContext";

const WalletSuccess: Component = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wallet = useWallet();
  
  const [countdown, setCountdown] = createSignal(5);
  const [isConnecting, setIsConnecting] = createSignal(true);
  const [connectionError, setConnectionError] = createSignal("");
  
  const isImport = location.state?.isImport || false;
  const mnemonic = location.state?.mnemonic || "";

  onMount(async () => {
    if (!mnemonic) {
      setConnectionError("No mnemonic provided");
      setIsConnecting(false);
      return;
    }

    try {
      setIsConnecting(true);
      
      const breezApiKey = import.meta.env.PRIMAL_BREEZ_API_KEY;
      
      if (!breezApiKey) {
        throw new Error('Breez API key not found. Please add PRIMAL_BREEZ_API_KEY to your .env file');
      }

      console.log('Loading Breez SDK...');
      const sdk = await import('@breeztech/breez-sdk-spark');
      
      console.log('Initializing WASM...');
      await sdk.default();
      console.log('WASM initialized');
      
      console.log('Creating config...');
      const config = sdk.defaultConfig('mainnet');
      config.apiKey = breezApiKey;
      config.lnurlDomain = 'pay.crays.net';
      config.privateEnabledDefault = false;
      
      console.log('Initializing wallet...');
      await wallet.initWallet(mnemonic, config);
      wallet.saveMnemonic(mnemonic);
      
      console.log("Wallet initialized successfully");
      setIsConnecting(false);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/wallet/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
      
    } catch (error: any) {
      console.error("Failed to initialize wallet:", error);
      setConnectionError(error.message || "Failed to connect to Lightning Network.");
      setIsConnecting(false);
    }
  });

  return (
    <div class={styles.successContainer}>
      <div class={styles.content}>
        {isConnecting() ? (
          <>
            <div class={styles.loadingAnimation}>
              <div class={styles.spinner}></div>
            </div>
            <h1 class={styles.title}>Connecting to Lightning Network...</h1>
            <p class={styles.description}>
              Please wait while we initialize your wallet and connect to the network.
            </p>
          </>
        ) : connectionError() ? (
          <>
            <svg class={styles.errorIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            </svg>
            <h1 class={styles.title}>Connection Failed</h1>
            <p class={styles.description}>{connectionError()}</p>
            <button class={styles.primaryButton} onClick={() => window.location.reload()}>
              Try Again
            </button>
          </>
        ) : (
          <>
            <div class={styles.successAnimation}>
              <div class={styles.checkmarkCircle}>
                <svg class={styles.checkmark} viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                  <circle class={styles.checkmarkCircleAnim} cx="26" cy="26" r="25" fill="none"/>
                  <path class={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
            </div>

            <h1 class={styles.title}>
              {isImport ? "Wallet Imported Successfully!" : "Wallet Created Successfully!"}
            </h1>
            
            <p class={styles.description}>
              Your Lightning wallet is ready!
            </p>

            <div class={styles.actions}>
              <button 
                class={styles.primaryButton}
                onClick={() => navigate("/wallet/dashboard")}
              >
                Go to Wallet
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill="currentColor"/>
                </svg>
              </button>

              <p class={styles.autoRedirect}>
                Redirecting automatically in {countdown()} seconds...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletSuccess;
