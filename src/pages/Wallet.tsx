import { Component, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import styles from "./WalletPage.module.scss";
import PageTitle from "../components/PageTitle/PageTitle";
import PageCaption from "../components/PageCaption/PageCaption";
import { useIntl } from "@cookbook/solid-intl";
import { wallets as t } from "../translations";

const Wallet: Component = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [hasWallet] = createSignal(false);

  return (
    <div class={styles.walletContainer}>
      <PageTitle title={intl.formatMessage(t.title)} />
      <PageCaption title={intl.formatMessage(t.title)} />

      {!hasWallet() && (
        <div class={styles.onboardingWrapper}>
          <div class={styles.heroSection}>
            <div class={styles.iconWrapper}>
              <svg class={styles.walletIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="currentColor"/>
              </svg>
            </div>
            <h2 class={styles.heroTitle}>Your Lightning Wallet</h2>
            <p class={styles.heroDescription}>
              Create a new wallet or import an existing one to start sending and receiving Lightning payments instantly.
            </p>
          </div>

          <div class={styles.actionCards}>
            <button 
              class={styles.actionCard}
              onClick={() => navigate("/wallet/create")}
            >
              <div class={styles.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 class={styles.cardTitle}>Create New Wallet</h3>
              <p class={styles.cardDescription}>
                Generate a new wallet with a secure recovery phrase
              </p>
              <span class={styles.cardArrow}>→</span>
            </button>

            <button 
              class={styles.actionCard}
              onClick={() => navigate("/wallet/import")}
            >
              <div class={styles.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16V10H5L12 3L19 10H15V16H9ZM5 20V18H19V20H5Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 class={styles.cardTitle}>Import Wallet</h3>
              <p class={styles.cardDescription}>
                Restore your wallet using a recovery phrase
              </p>
              <span class={styles.cardArrow}>→</span>
            </button>
          </div>

          <div class={styles.securityNote}>
            <svg class={styles.shieldIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="currentColor"/>
            </svg>
            <p>Your keys, your Bitcoin. All data is stored securely on your device.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
