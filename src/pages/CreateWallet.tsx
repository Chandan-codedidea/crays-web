import { Component, createSignal, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import styles from "./CreateWallet.module.scss";

const CreateWallet: Component = () => {
  const navigate = useNavigate();
  
  // Simulated seed phrase generation (replace with actual Breez SDK)
  const generateSeedPhrase = (): string[] => {
    const words = [
      "abandon", "ability", "able", "about", "above", "absent",
      "absorb", "abstract", "absurd", "abuse", "access", "accident"
    ];
    return words;
  };

  const [seedPhrase] = createSignal(generateSeedPhrase());
  const [isRevealed, setIsRevealed] = createSignal(false);
  const [isCopied, setIsCopied] = createSignal(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(seedPhrase().join(" "));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVerify = () => {
    navigate("/wallet/verify", { state: { seedPhrase: seedPhrase() } });
  };

  return (
    <div class={styles.createWalletContainer}>
      <div class={styles.header}>
        <button class={styles.backButton} onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
        </button>
        <h1 class={styles.title}>Create Wallet</h1>
      </div>

      <div class={styles.content}>
        <div class={styles.warningCard}>
          <svg class={styles.warningIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
          </svg>
          <div class={styles.warningContent}>
            <h3>Save Your Recovery Phrase</h3>
            <p>
              Write down these 12 words in order and store them somewhere safe. 
              This is the ONLY way to recover your wallet.
            </p>
          </div>
        </div>

        <div class={styles.phraseSection}>
          <div class={styles.phraseHeader}>
            <h3>Your Recovery Phrase</h3>
            <button 
              class={styles.revealButton}
              onClick={() => setIsRevealed(!isRevealed())}
            >
              {isRevealed() ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" fill="currentColor"/>
                  </svg>
                  Hide
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 22.99 12C21.26 7.61 16.99 4.5 11.99 4.5C10.59 4.5 9.25 4.75 8.01 5.2L10.17 7.36C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10.02 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM11.84 9.02L14.99 12.17L15.01 12.01C15.01 10.35 13.67 9.01 12.01 9.01L11.84 9.02Z" fill="currentColor"/>
                  </svg>
                  Reveal
                </>
              )}
            </button>
          </div>

          <div class={`${styles.phraseGrid} ${!isRevealed() ? styles.blurred : ""}`}>
            <For each={seedPhrase()}>
              {(word, index) => (
                <div class={styles.phraseWord}>
                  <span class={styles.wordNumber}>{index() + 1}</span>
                  <span class={styles.wordText}>{word}</span>
                </div>
              )}
            </For>
          </div>

          {!isRevealed() && (
            <div class={styles.blurOverlay}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 22.99 12C21.26 7.61 16.99 4.5 11.99 4.5C10.59 4.5 9.25 4.75 8.01 5.2L10.17 7.36C10.74 7.13 11.35 7 12 7Z" fill="currentColor"/>
              </svg>
              <p>Click "Reveal" to view your recovery phrase</p>
            </div>
          )}
        </div>

        <div class={styles.actions}>
          <button 
            class={styles.copyButton}
            onClick={handleCopy}
            disabled={!isRevealed()}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
            </svg>
            {isCopied() ? "Copied!" : "Copy to Clipboard"}
          </button>

          <button 
            class={styles.verifyButton}
            onClick={handleVerify}
            disabled={!isRevealed()}
          >
            Continue to Verification
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div class={styles.securityTips}>
          <h4>Security Tips</h4>
          <ul>
            <li>Never share your recovery phrase with anyone</li>
            <li>Store it in a secure, offline location</li>
            <li>Anyone with this phrase can access your funds</li>
            <li>Breez will never ask you for your recovery phrase</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateWallet;
