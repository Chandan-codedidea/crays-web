import { Component } from 'solid-js';
import styles from './Terms.module.scss';
import Branding from '../components/Branding/Branding';

const Privacy: Component = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div class={styles.terms}>
      <header class={styles.header}>
        <Branding />
      </header>

      <div class={styles.content}>
        <h1>
          Crays Privacy Policy
        </h1>
        <p class={styles.lastUpdated}>
          Last updated: November 26, 2025
        </p>
        <p class={styles.intro}>
          This Agreement is between you and Crays Ltd., an Abu Dhabi corporation ("Crays", "we", "us", or "our"), Crays Ltd., Unit D134, Office 2905, Floor 29, Sky Tower, Shams Abu Dhabi, Abu Dhabi, AlReem Island, United Arab Emirates pertaining to your use of Crays applications and services, including but not limited to the Crays web app, Crays iOS app, Crays Android app, Crays browser extension, Crays Premium Service, or Crays Hosted Wallet Service (collectively referred to as "Services").
        </p>

        <section class={styles.section}>
          <h2>
            1. Policy Overview
          </h2>
          <p>
            Crays doesn't monetize your personal information. We don't generate revenue via advertising, we don't monetize user attention, and we don't sell personal information we collect from our users. Crays's policy is to maximize user privacy by collecting only the minimum amount of personal information required to provide quality Services to our users and be compliant with the relevant laws.
          </p>
        </section>

        <section class={styles.section}>
          <h2>
            2. Information We Collect
          </h2>

          <div class={styles.subsection}>
            <h3>2.1 Account Creation.</h3>
            <p>
              Crays enable you to create an account on the public Nostr network. All information you provide during the account creation process is optional, except for the desired username. Any personal information you disclose during the account creation process is published to the relays on the public Nostr network as a normal manner of course for all Nostr accounts. This information is public and can be seen by anyone on the Nostr network. Crays does not collect any further information about you during the account creation process.
            </p>
          </div>

          <div class={styles.subsection}>
            <h3>2.2 Crays Mobile Apps.</h3>
            <p>
              Crays does not collect any data via our mobile apps – Crays for iOS and Crays for Android – beyond the data you specifically submit for publishing on the public Nostr network and when activating the optional Hosted Wallet Service, as described in section 2.4. Privacy and data collection notices on the public Apple App Store and Google Play Store listings display data collection settings for our mobile apps.
            </p>
          </div>

          <div class={styles.subsection}>
            <h3>2.3 Premium Service.</h3>
            <p>
              Crays Premium Service is an optional, subscription-based, paid tier offered to you, which includes Crays Orange Check as defined in our Terms of Service agreement, and certain premium features, as defined on Crays's Website. Our Premium Service is specifically designed for maximum protection of user privacy, and as such, does not require disclosing any personal information.
            </p>
          </div>

          <div class={styles.subsection}>
            <h3>2.4 Hosted Wallet Service.</h3>
            <p>
              Crays Hosted Wallet Service is an optional service offered to you, which includes storing small amounts of bitcoin on your behalf, the ability to send and receive bitcoin transactions on your behalf, the display of your transaction history, and hosting a Bitcoin Lightning Address assigned to you. In order to activate the Hosted Wallet Service in a legally compliant manner, we collect the minimum amount of personal information required by law, as shown on the Wallet Activation screen.
            </p>
          </div>

          <div class={styles.subsection}>
            <h3>2.5 Support Services.</h3>
            <p>
              Crays provides support via email and over social media. The information you provide during the regular course of communication with us will be stored in our email systems and otherwise be recorded on the various social media systems we use to communicate with you.
            </p>
          </div>
        </section>

        <section class={styles.section}>
          <h2>
            3. How We Use Your Information
          </h2>
          <p>
            We use your personal information to provide high quality service to you, including offering Support Services, and to generally operate Crays services and communicate with you as necessary.
          </p>
        </section>

        <section class={styles.section}>
          <h2>
            4. Sharing Your Information
          </h2>
          <p>
            Crays will not share your information with third parties, except when required by law. We may share your personal data with law enforcement, data protection authorities, government officials and other authorities when: (i) compelled by subpoena, court order or other legal procedure; (ii) we believe that disclosure is necessary to prevent damage or financial loss; (iii) disclosure is necessary to report suspected illegal activity; or (iv) disclosure is necessary to investigate violations of our Terms of Service or Privacy Policy.
          </p>
          <p>
            Crays's Hosted Wallet Service is offered in partnership with our affiliate Breez, Inc. ("Breez"). In order to provide a legally compliant service, we are required to share your information related to the Hosted Wallet Service with Breez.
          </p>
        </section>

        <section class={styles.section}>
          <h2>
            5. Your Rights and Choices
          </h2>
          <p>
            You have rights and choices with respect to your personal information, including: (i) accessing and updating your information: you can review and change your personal information by logging into your account; (ii) deactivation and deletion: you can deactivate your account or request the deletion of your information.
          </p>
        </section>

        <section class={styles.section}>
          <h2>
            6. Security of Your Information
          </h2>
          <p>
            Crays implements robust security measures, based on industry's best practices, to protect the confidentiality, integrity, and availability of your personal and financial information. However, no system is completely secure, and we cannot guarantee the absolute security of your information.
          </p>
        </section>

        <section class={styles.section}>
          <h2>
            7. Changes to This Privacy Policy
          </h2>
          <p>
            We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of this notice and, in some cases, we may provide you with additional notice (such as adding a statement to our Website or sending you a notification). We encourage you to review this Privacy Policy regularly to stay informed about our information handling practices and the choices available to you.
          </p>
        </section>

        <section class={styles.section}>
          <h2>
            8. Contact Us
          </h2>
          <p>
            If you have any questions regarding this Privacy Policy, you may contact us at info@crays.net.
          </p>
        </section>
      </div>

      <footer class={styles.footer}>
        <button class={styles.backButton} onClick={handleGoBack}>
          ← Back
        </button>
      </footer>
    </div>
  );
}

export default Privacy;