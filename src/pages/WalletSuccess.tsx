import { Component, createEffect, createSignal } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import styles from "./WalletSuccess.module.scss";

const WalletSuccess: Component = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = createSignal(5);
  
  const isImport = location.state?.isImport || false;

  createEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/wallet/dashboard"); // Navigate to main wallet dashboard
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  return (
    <div class={styles.successContainer}>
      <div class={styles.content}>
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
          {isImport 
            ? "Your wallet has been successfully restored. You can now access your funds and start using Lightning payments."
            : "Your new Lightning wallet is ready! You can now start sending and receiving Bitcoin instantly."
          }
        </p>

        <div class={styles.features}>
          <div class={styles.feature}>
            <div class={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 7H11V11H7V13H11V17H13V13H17V11H13V7ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Instant Payments</h3>
            <p>Send and receive Bitcoin in seconds</p>
          </div>

          <div class={styles.feature}>
            <div class={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Self-Custodial</h3>
            <p>You control your private keys</p>
          </div>

          <div class={styles.feature}>
            <div class={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 1.07V9H21C21 4.58 17.42 1 13 1.07ZM4 15C4 18.87 7.13 22 11 22C13.05 22 14.89 21.12 16.19 19.73L15 18.54C14.03 19.47 12.59 20 11 20C8.24 20 6 17.76 6 15C6 12.24 8.24 10 11 10C11.66 10 12.29 10.12 12.86 10.32L13.95 9.23C12.98 8.76 11.95 8.5 10.87 8.5C7 8.5 3.87 11.63 3.87 15.5L4 15ZM20 18.59L22.54 21.12L21.12 22.54L18.59 20L16.06 22.54L14.65 21.12L17.18 18.59L14.65 16.06L16.06 14.65L18.59 17.18L21.12 14.65L22.54 16.06L20 18.59ZM15 1C14.66 1 14.33 1.03 14 1.07V7H19.93C19.65 3.96 17.44 1.54 15 1Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Low Fees</h3>
            <p>Minimal transaction costs</p>
          </div>
        </div>

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

        <div class={styles.nextSteps}>
          <h4>What's Next?</h4>
          <ul>
            <li>Fund your wallet by receiving Lightning payments</li>
            <li>Generate a Lightning invoice to receive funds</li>
            <li>Explore the Lightning Network ecosystem</li>
            <li>Backup your recovery phrase securely</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WalletSuccess;
