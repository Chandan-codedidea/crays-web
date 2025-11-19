import { Component, createSignal, For } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import styles from "./VerifyPhrase.module.scss";

const VerifyPhrase: Component = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const seedPhrase = location.state?.seedPhrase || [];
  
  // Select 4 random words to verify
  const generateVerificationWords = () => {
    const indices: number[] = [];
    while (indices.length < 4) {
      const random = Math.floor(Math.random() * 12);
      if (!indices.includes(random)) {
        indices.push(random);
      }
    }
    return indices.sort((a, b) => a - b);
  };

  const [verificationIndices] = createSignal(generateVerificationWords());
  const [userInputs, setUserInputs] = createSignal<{ [key: number]: string }>({});
  const [errors, setErrors] = createSignal<{ [key: number]: boolean }>({});
  const [showError, setShowError] = createSignal(false);

  const handleInputChange = (index: number, value: string) => {
    setUserInputs({ ...userInputs(), [index]: value.trim().toLowerCase() });
    setErrors({ ...errors(), [index]: false });
    setShowError(false);
  };

  const handleVerify = () => {
    const newErrors: { [key: number]: boolean } = {};
    let hasError = false;

    verificationIndices().forEach(index => {
      if (userInputs()[index] !== seedPhrase[index]) {
        newErrors[index] = true;
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      setShowError(true);
    } else {
      // Success! Navigate to wallet or complete setup
      navigate("/wallet/success");
    }
  };

  const isFormComplete = () => {
    return verificationIndices().every(index => userInputs()[index]?.length > 0);
  };

  return (
    <div class={styles.verifyContainer}>
      <div class={styles.header}>
        <button class={styles.backButton} onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
        </button>
        <h1 class={styles.title}>Verify Recovery Phrase</h1>
      </div>

      <div class={styles.content}>
        <div class={styles.instruction}>
          <svg class={styles.checkIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
          </svg>
          <div>
            <h3>Confirm Your Recovery Phrase</h3>
            <p>Enter the following words from your recovery phrase to confirm you've saved it correctly.</p>
          </div>
        </div>

        {showError() && (
          <div class={styles.errorBanner}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            </svg>
            <p>Some words don't match. Please try again.</p>
          </div>
        )}

        <div class={styles.verificationForm}>
          <For each={verificationIndices()}>
            {(index) => (
              <div class={styles.inputGroup}>
                <label class={styles.label}>
                  Word #{index + 1}
                </label>
                <input
                  type="text"
                  class={`${styles.input} ${errors()[index] ? styles.inputError : ""}`}
                  placeholder={`Enter word #${index + 1}`}
                  value={userInputs()[index] || ""}
                  onInput={(e) => handleInputChange(index, e.currentTarget.value)}
                />
                {errors()[index] && (
                  <span class={styles.errorText}>Incorrect word</span>
                )}
              </div>
            )}
          </For>
        </div>

        <button 
          class={styles.verifyButton}
          onClick={handleVerify}
          disabled={!isFormComplete()}
        >
          Verify & Complete Setup
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
          </svg>
        </button>

        <button class={styles.backLink} onClick={() => navigate(-1)}>
          ← Back to recovery phrase
        </button>
      </div>
    </div>
  );
};

export default VerifyPhrase;
