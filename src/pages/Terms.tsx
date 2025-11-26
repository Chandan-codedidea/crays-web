import { Component, onMount } from 'solid-js';
import styles from './Terms.module.scss';
import Branding from '../components/Branding/Branding';

const Terms: Component = () => {



  return (
    <div class={styles.terms} >
      <header class={styles.header}>
        <Branding />
      </header>

      <h1>
        Crays Terms of Service
      </h1>
      <p>
        Last updated: November 26, 2025
      </p>
      <p>
        This Agreement is between you and Crays Ltd., an Abu Dhabi corporation (“Crays”, “we”, “us”, or “our”), Crays Ltd., Unit D134, Office 2905, Floor 29, Sky Tower, Shams Abu Dhabi, Abu Dhabi, AlReem Island, United Arab Emirates pertaining to your use of Crays applications and services, including but not limited to the Crays web app, Crays iOS app, Crays Android app, Crays browser extension, Crays Premium Service, or Crays Hosted Wallet Service (collectively referred to as “Services”).
      </p>
      <p>
        This Agreement constitutes a binding obligation between you and Crays. Services are provided by Crays, including our affiliates, as applicable. By using our Services, you agree to be bound by this Agreement, the Acceptable Use Policy, and any additional provisions and conditions provided to you for your use of Services (collectively, the “Policies”), which may include terms and conditions from third parties. If you don’t agree to all the stated terms, you may not use our Services.
      </p>
      <p>
        We will periodically revise and update this Agreement and post the updated version to Crays Website, as further described in Section 9 (Changes to Agreement or Services).
      </p>

      <section>
        <h2>
          1. Acceptable Use Policy
        </h2>

        <section>
          <h3>1.1 Eligibility and Account Creation.</h3>
          By using our Services, you represent and warrant that you are at least 18 years of age and may legally agree to this Agreement. Crays assumes no responsibility or liability for any misrepresentation of your age.
        </section>

        <section>
          <h3>1.2 Your Account Rights and Responsibilities.</h3>
          When creating an account via Crays, you will be assigned a cryptographic key pair, consisting of your private key (starting with “nsec”), and your public key (starting with “npub”). Your private key grants you full and exclusive control over your account on the public Nostr network. Your responsibility is to keep your private key secret and safely stored. Crays assumes no responsibility or liability for lost or stolen keys.
          Crays does not have access to your private key and has no ability to restore it if you lose it. You have the right to use your Nostr account on third party services by logging in via your private key. If you wish to do so, you may completely abandon using Crays and continue using your Nostr account on third party services. As a sovereign owner of your Nostr account, you don’t require Crays permission nor cooperation to use your Nostr account as you deem fit.
        </section>

        <section>
          <h3>1.3 Content ownership.</h3>
          You retain all your ownership rights to the content you create. However, by submitting content to Crays, you hereby grant Crays Systems Inc. a worldwide, non-exclusive, royalty-free, sublicensable and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform the content in connection with our Services and Crays 's (and its successors' and affiliates') business.
        </section>

        <section>
          <h3>1.4 Prohibited content.</h3>
          You agree not to use our Services to create, upload, post, send, store, or share any content that is illegal, infringing, fraudulent, harmful, threatening, abusive, hateful, harassing, defamatory, obscene, or invasive of another's privacy. Such content includes, but is not limited to, content that is harmful to minors, pornographic material, violent images, hate speech, discriminatory content, and content that promotes terrorism or other criminal activities.
        </section>

        <section>
          <h3>1.5 Prohibited conduct.</h3>
          You agree not to use our Services to engage in any conduct that harasses others, impersonates others, is intended to intimidate, or threaten others, or is intended to promote or incite violence.
        </section>

        <section>
          <h3>1.6 Media storage limits for the Free Tier.</h3>
          If you are using our Services at no cost to you via the Free Tier, you are allowed to upload media files (images and videos) up to the storage and file size limit for Free Tier accounts, as specified on Crays Website. Exceeding the specified limit means that your older media will be deleted to make room for the new files you are uploading. Crays may change the Free Tier storage and file size limits at any time. This service is provided on a best effort basis. Crays makes no warranties whatsoever that any media stored via the Free Tier will be preserved for any length of time.
        </section>
      </section>

      <section>
        <h2>
          2. Privacy Notice
        </h2>

        <section>
          Please refer to the "Crays Privacy Policy", available at www.Crays net/privacy, for information on how we collect, use, and disclose information, including your personal information. You acknowledge and agree that through your use of the Services, you consent to the collection, use, and disclosure of your information as set forth in the Privacy Policy. In providing the personal information of any individual (other than yourself) that may receive transactions from you as part of your use of the Services, you agree that you have obtained consent from such individual to disclose their personal information to us, as well as their consent to our collection, use, storage, and disclosure of such personal information, in the manner and for the purposes set out in our Privacy Policy.
        </section>
      </section>

      <section>
        <h2>
          3. Premium Service
        </h2>

        <section>
          <h3>3.1 Premium Service Definition.</h3>
          Crays Premium Service is an optional, subscription-based, paid tier offered to you, which includes Crays Orange Check as defined in section 3.2 of this Agreement, increased media storage, and certain premium features, as defined on Crays 's Website.
        </section>

        <section>
          <h3>3.2 Crays Orange Check.</h3>
          Crays Orange Check is a service that provides a personalized username at Crays .net (“Crays Name”) to all Crays Premium Service users. Crays Orange Check includes a verified Nostr Address at crays .net, Bitcoin Lightning Address at Crays .net, and a VIP profile address at Crays .net. By way of example, a user who selected "preston" as their Crays Name would have "preston@crays.net" as their verified Nostr Address, "preston@crays .net" as their Bitcoin Lightning Address, and "crays.net/preston" as their VIP profile address.
        </section>

        <section>
          <h3>3.3 Crays Name Ownership.</h3>
          Crays remains the exclusive owner of all Crays Names. Crays Name is rented, not sold, to you for the duration of your subscription, as defined in section 3.4 of this Agreement. Crays reserves the right to revoke any Crays Name at any time, without prior notice, if we determine that the name is trademarked by somebody else, that there is a possible case of impersonation, or for any other reason at our sole discretion. Purchasing a Crays Premium Service subscription grants you the right to use a Crays Name for the duration of the subscription, but Crays makes no guarantees that your selected name will remain available to you for the duration of your subscription. Should the name you have selected be revoked by Crays during your subscription term, you have the right to select another name, provided that this new name is available and acceptable to Crays.
        </section>

        <section>
          <h3>3.4 Premium Service Duration.</h3>
          Crays Premium Service will be offered for the duration specified during the purchase process. Crays will clearly display the expiration date of your subscription in your Premium Profile Settings. You are allowed to renew and extend your subscription at any time. Crays reserves the right to terminate your subscription for a cause, as described in Section 5 of this Agreement (Cancellation, Suspension, or Termination of Services).
        </section>

        <section>
          <h3>3.5 Expired Premium Subscription.</h3>
          If you allow your Premium Service subscription to expire, you will lose all Premium Service benefits. Upon expiration, Crays will offer a Grace Period of seven days, during which your Premium Service benefits will continue to be available to you at no charge. After the expiration of the Grace Period, your Crays Name will no longer be associated with your Nostr account and will become available to another user to reserve. Your media storage in excess of the allotment offered to Free Tier users will be deleted from Crays 's servers.
        </section>
      </section>

      <section>
        <h2>
          4. Hosted Wallet Service
        </h2>

        <section>
          <h3>4.1 Premium Service Definition.</h3>
          Crays Hosted Wallet Service is an optional service offered to you, which includes storing small amounts of bitcoin on your behalf, as defined in Section 4.3 Maximum Wallet Balance, the ability to send and receive bitcoin transactions on your behalf, the display of your transaction history, and hosting a Bitcoin Lightning Address assigned to you.
        </section>

        <section>
          <h3>4.2 Crays Orange Check.</h3>
          Bitcoin custody, send, and receive operations are performed by Crays 's affiliate Zap Solutions, Inc. ("Strike"). By using our Hosted Wallet Service, you agree to be bound by this Agreement, as well as Strike's Terms of Service, as defined at https://strike.me/legal/tos/. Crays reserves the right to change the Wallet Third Party Service provider without prior notice, or to bring some or all of these services in-house. All such changes will be reflected in an update to this Agreement, as further described in Section 9 (Changes to Agreement or Services).
        </section>

        <section>
          <h3>4.3 Maximum Wallet Balance.</h3>
          The purpose of our Hosted Wallet Service is to provide an easy-to-use spending bitcoin wallet with minimal setup effort. You should not use the Crays Hosted Wallet Service to store amounts that exceed the value you would carry in a physical spending wallet. For larger amounts, Crays recommends self-custody, preferably in a bitcoin-specialized hardware wallet. Crays is enforcing a Maximum Wallet Balance to ensure that all users are using our Hosted Wallet Service for the purpose it was designed for. Your Maximum Wallet Balance is displayed in your Wallet Settings. If you attempt to credit your wallet with an amount that would exceed your Maximum Wallet Balance, you may need to contact Crays Support at support@Crays.net to get a refund.
        </section>

        <section>
          <h3>4.4 Wallet Activation and Control.</h3>
          When you activate your Crays Wallet and register for the Hosted Wallet Service, you agree to provide accurate, current, and complete information as prompted by the registration form. Your wallet is controlled by your Nostr private key (starting with "nsec") and the verified email address you provided during registration. It is your responsibility to keep your Nostr private key secret and safely stored, as well as to ensure that nobody else has access to the email account you used to register for our Hosted Wallet Service. If either your Nostr private key or your email account get compromised, this may result in loss of funds in your Crays Wallet. Crays assumes no responsibility nor liability for loss of funds resulting from a compromised private key and/or email account.
        </section>

        <section>
          <h3>4.5 Transaction Fees.</h3>
          Transaction fees for incoming and outgoing payments within your Crays Wallet are a combination of bitcoin network fees, fees charged by Crays 's affiliates (if any), and fees charged by Crays (if any). Transaction fee policy is subject to change without notice. Crays Wallet will clearly display the fees charged for each transaction on the Transaction Details screen.
        </section>

        <section>
          <h3>4.6 In-app Purchase Fees.</h3>
          Crays Wallet offers the ability to purchase small amounts of bitcoin, typically in USD $5 increments, via the Apple/Google in-app purchase. Apple and Google charge a considerable fee for these transactions. Prior to your purchase, Crays will clearly display the exact amount of bitcoin (expressed in satoshis) that you will receive for the specific fiat amount you will be paying. Crays makes no revenue from in-app purchases. All in-app purchases are final, Crays offers no refunds.
        </section>

        <section>
          <h3>4.7 Mistaken and Unauthorized Transactions.</h3>
          All payments made via the Crays Hosted Wallet Service are final. If a mistaken or unauthorized transaction occurs, you will need to contact the payee directly to recover the funds. Crays accepts no liability for mistaken or unauthorized transactions.
        </section>

        <section>
          <h3>4.8 Taxes.</h3>
          It is your responsibility to determine what, if any, taxes you owe in relation to bitcoin transactions, including spending, buying, and selling bitcoin. It is your responsibility to report and remit any such tax to the appropriate tax authority. You agree that Crays is not responsible for determining whether taxes apply to your use of the Services, including your transactions, or for collecting, reporting, withholding, or remitting any taxes arising from your use of the Services.
        </section>
      </section>

      <section>
        <h2>
          5. Cancellation, Suspension, or Termination of Services
        </h2>

        <section>
          <h3>5.1 Account Cancellation.</h3>
          We may, in our sole discretion and without any cost or liability to you, with or without prior notice and at any time, suspend, modify, or terminate, temporarily or permanently, all or any portion of our Services, establish certain transaction limits or trading limits, or terminate your Account, with or without reason, including, if we reasonably believe: (i) you create risk or possible legal exposure for us; (ii) our provision of the Services to you is no longer commercially viable; or (iii) you breached any terms of this Agreement.
        </section>

        <section>
          <h3>5.2 Account Suspension.</h3>
          We have the right to immediately cause your Account to be suspended, and the funds and assets in your Account may be frozen if: (i) we suspect, in our sole discretion, your Account to be in violation of this Agreement or our Anti-Money Laundering program; (ii) we are required to do so by a government or regulatory authority, applicable law, court order, or a facially valid subpoena; (iii) your Account has a negative balance; (iv) a transfer to your Account was returned to your Bank Account; (v) we believe there is unusual activity in your Account or that you are using your Credentials or your Account in an unauthorized or inappropriate manner; or (vi) if you have not accessed your Account in more than two years. Your Account will remain suspended and funds and assets in your Account will remain frozen until a determination is made in the investigation by Crays, at which point Crays may determine to terminate your Account.
        </section>
      </section>

      <section>
        <h2>
          6. Disclaimer of Warranty
        </h2>

        <p>
          You acknowledge that our Services are provided on an "as is" and "as available" basis without any warranty of any kind, express or implied. We make no guarantees that our Services will be error-free or run without interruptions, and we do not make any warranty regarding the quality, accuracy, reliability, or suitability of our Services for any particular purpose.
        </p>
      </section>

      <section>
        <h2>
          7. Indemnity
        </h2>

        <p>
          You will indemnify and hold harmless Crays and its affiliates, and their respective officers, directors, employees, and agents, from and against any claims, disputes, demands, liabilities, damages, losses, and costs and expenses (including, without limitation reasonable legal and accounting fees) arising out of or in any way connected with (a) your improper or unauthorized access to or use of the Services; and (b) your violation of this Agreement.
        </p>
      </section>

      <section>
        <h2>
          8. Limitations of Liability
        </h2>

        <section>
          <h3>8.1 CONSEQUENTIAL DAMAGES WAIVER.</h3>
          NOTWITHSTANDING ANY OTHER SECTION OF THIS AGREEMENT, NEITHER CRAYS , ITS AFFILIATES, THIRD-PARTY SERVICE PROVIDERS, NOR ANY OTHER PARTY INVOLVED IN CREATING, PRODUCING, OR DELIVERING THE SERVICES WILL BE LIABLE FOR ANY INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES, OR DAMAGES FOR LOST PROFITS, LOST REVENUES, TRADING LOSSES, LOST SAVINGS, LOST BUSINESS OPPORTUNITY, LOSS OF DATA OR GOODWILL, SERVICE INTERRUPTION, COMPUTER DAMAGE OR SYSTEM FAILURE OR THE COST OF SUBSTITUTE SERVICES OF ANY KIND ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR FROM THE USE OF OR INABILITY TO USE THE SERVICES, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), PRODUCT LIABILITY, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT CRAYS , ITS AFFILIATES, OR ANY OTHER PARTY HAS BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, SO THE ABOVE LIMITATION MAY NOT APPLY TO YOU.
        </section>

        <section>
          <h3>8.2 LIABILITY CAP.</h3>
          NOTWITHSTANDING ANY OTHER SECTION OF THIS AGREEMENT, IN NO EVENT WILL CRAYS 'S AND ITS AFFILIATES' TOTAL LIABILITY ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR FROM THE USE OF OR INABILITY TO USE THE SERVICES EXCEED ONE HUNDRED U.S. DOLLARS ($100).
        </section>

        <section>
          <h3>8.3 BASIS OF BARGAIN AND FAILURE OF ESSENTIAL PURPOSE.</h3>
          THE EXCLUSIONS AND LIMITATIONS OF DAMAGES SET FORTH ABOVE ARE FUNDAMENTAL ELEMENTS OF THE BASIS OF THE BARGAIN BETWEEN CRAYS AND YOU. THE WAIVERS AND LIMITATIONS IN THIS SECTION 8 APPLY REGARDLESS OF THE FORM OF ACTION, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, AND WILL SURVIVE AND APPLY EVEN IF ANY LIMITED REMEDY IN THESE TERMS FAILS OF ITS ESSENTIAL PURPOSE.
        </section>
      </section>

      <section>
        <h2>
          9. Changes to Agreement or Services
        </h2>

        <p>
          We may update this Agreement at any time at our sole discretion. If we do so, we will deliver a notice by posting the updated Agreement to Crays Website at www.Crays.net/terms, and potentially through other communication(s) deemed appropriate by us. Accordingly, it is important that you review this Agreement on Crays Website regularly for updates, including when you use the Services. If you continue to use the Services after we have posted an updated Agreement, you are agreeing to be bound by the updated Agreement. If you do not agree to be bound by the updated Agreement, then you may not use the Services anymore. As our Services evolve, we may change or discontinue all or any part of the Services, at any time and without notice, at our sole discretion.
        </p>
      </section>

      <section>
        <h2>
          10. Governing Law
        </h2>

        <p>
          This Agreement shall be governed by and in accordance with the laws of ADGM, Abu Dhabi, UAE.
        </p>
      </section>

      <section>
        <h2>
          11. Acceptance of Terms
        </h2>

        <p>
          By using our Services, you signify your acceptance of this Agreement. If you do not agree to the terms of this Agreement, you may not use our Services.
        </p>
      </section>

      <section>
        <h2>
          12. Contact Information
        </h2>

        <p>
          If you have any questions regarding this Agreement, you may contact us at info@crays net.
        </p>
      </section>
    </div>
  );
}

export default Terms;
