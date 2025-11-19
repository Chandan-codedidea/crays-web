import { Component, createSignal, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import styles from "./ImportWallet.module.scss";

const ImportWallet: Component = () => {
  const navigate = useNavigate();
  
  const [seedWords, setSeedWords] = createSignal<string[]>(Array(12).fill(""));
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...seedWords()];
    newWords[index] = value.trim().toLowerCase();
    setSeedWords(newWords);
    setError("");
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    const words = pastedText.trim().split(/\s+/);
    
    if (words.length === 12 || words.length === 24) {
      const newWords = words.slice(0, 12).map(w => w.toLowerCase());
      setSeedWords([...newWords, ...Array(Math.max(0, 12 - newWords.length)).fill("")]);
      setError("");
    } else {
      setError("Please paste a valid 12 or 24-word recovery phrase");
    }
  };

  const validateAndImport = async () => {
    const words = seedWords().filter(w => w.length > 0);
    
    if (words.length !== 12) {
      setError("Please enter all 12 words");
      return;
    }

    // TODO: Replace with actual Breez SDK validation
    const isValid = words.every(word => word.length > 0);
    
    if (!isValid) {
      setError("Invalid recovery phrase. Please check your words and try again.");
      return;
    }

    setIsLoading(true);
    
    // Simulate wallet import (replace with actual Breez SDK import)
    setTimeout(() => {
      setIsLoading(false);
      navigate("/wallet/success", { state: { isImport: true } });
    }, 2000);
  };

  const isFormComplete = () => {
    return seedWords().filter(w => w.length > 0).length === 12;
  };

  const handleClear = () => {
    setSeedWords(Array(12).fill(""));
    setError("");
  };

  return (
    <div class={styles.importContainer}>
      <div class={styles.header}>
        <button class={styles.backButton} onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
        </button>
        <h1 class={styles.title}>Import Wallet</h1>
      </div>

      <div class={styles.content}>
        <div class={styles.infoCard}>
          <svg class={styles.infoIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
          </svg>
          <div class={styles.infoContent}>
            <h3>Restore Your Wallet</h3>
            <p>
              Enter your 12-word recovery phrase to restore your wallet. 
              Make sure you're in a private place and no one can see your screen.
            </p>
          </div>
        </div>

        {error() && (
          <div class={styles.errorBanner}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            </svg>
            <p>{error()}</p>
          </div>
        )}

        <div class={styles.phraseSection}>
          <div class={styles.phraseHeader}>
            <h3>Recovery Phrase</h3>
            <button class={styles.clearButton} onClick={handleClear}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
              Clear All
            </button>
          </div>

          <div class={styles.phraseGrid} onPaste={handlePaste}>
            <For each={seedWords()}>
              {(word, index) => (
                <div class={styles.wordInput}>
                  <span class={styles.wordNumber}>{index() + 1}</span>
                  <input
                    type="text"
                    class={styles.input}
                    placeholder={`Word ${index() + 1}`}
                    value={word}
                    onInput={(e) => handleWordChange(index(), e.currentTarget.value)}
                    autocomplete="off"
                    spellcheck={false}
                  />
                </div>
              )}
            </For>
          </div>

          <div class={styles.pasteHint}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
            </svg>
            <p>You can paste all 12 words at once</p>
          </div>
        </div>

        <button 
          class={styles.importButton}
          onClick={validateAndImport}
          disabled={!isFormComplete() || isLoading()}
        >
          {isLoading() ? (
            <>
              <div class={styles.spinner}></div>
              Importing Wallet...
            </>
          ) : (
            <>
              Import Wallet
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16V10H5L12 3L19 10H15V16H9ZM5 20V18H19V20H5Z" fill="currentColor"/>
              </svg>
            </>
          )}
        </button>

        <div class={styles.securityWarning}>
          <h4>⚠️ Security Warning</h4>
          <ul>
            <li>Never share your recovery phrase with anyone</li>
            <li>Breez support will never ask for your recovery phrase</li>
            <li>Be aware of phishing attempts and fake websites</li>
            <li>Store your phrase securely offline after import</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportWallet;
