import { createContext, useContext, ParentComponent } from "solid-js";

export interface WalletContextValue {
  initWallet: (mnemonic: string, config: any) => Promise<void>;
  disconnect: () => Promise<void>;
  getWalletInfo: () => Promise<any>;
  getTransactions: () => Promise<any[]>;
  getSavedMnemonic: () => string | null;
  saveMnemonic: (mnemonic: string) => void;
  clearMnemonic: () => void;
  connected: () => boolean;
  getSdkInstance: () => any;
  // Add these:
  parseInput: (input: string) => Promise<any>;
  prepareLnurlPay: (params: any) => Promise<any>;
  lnurlPay: (params: any) => Promise<any>;
  prepareSendPayment: (params: {
    paymentRequest: string;
    amount: bigint;
  }) => Promise<any>;

  sendPayment: (params: {
    prepareResponse: any;
    options?: any;
  }) => Promise<any>;
  ensureConnected: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>();

let breezSdkInstance: any = null;

export const WalletProvider: ParentComponent = (props) => {
  const initWallet = async (mnemonic: string, config: any) => {
    if (breezSdkInstance) {
      console.log("SDK already connected");
      return;
    }

    try {
      const sdk = await import("@breeztech/breez-sdk-spark");

      breezSdkInstance = await sdk.connect({
        config,
        seed: {
          type: "mnemonic",
          mnemonic,
        },
        storageDir: "breez-wallet-storage",
      });

      console.log("Breez SDK connected successfully");
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      breezSdkInstance = null;
      throw error;
    }
  };

  // NEW helper that *uses* initWallet
  const ensureConnected = async () => {
    if (breezSdkInstance) return;

    const savedMnemonic = getSavedMnemonic();
    if (!savedMnemonic) throw new Error("Wallet not set up");

    const sdk = await import("@breeztech/breez-sdk-spark");
    await sdk.default();

    const breezApiKey = import.meta.env.PRIMAL_BREEZ_API_KEY;
    const config = sdk.defaultConfig("mainnet");
    config.apiKey = breezApiKey;
    config.lnurlDomain = "pay.crays.net";

    await initWallet(savedMnemonic, config);
  };

  const disconnectWallet = async () => {
    if (breezSdkInstance) {
      try {
        await breezSdkInstance.disconnect();
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
      breezSdkInstance = null;
    }
  };

  const getWalletInfo = async () => {
    if (!breezSdkInstance) throw new Error("SDK not initialized");

    try {
      const info = await breezSdkInstance.getInfo({});
      return info;
    } catch (error) {
      console.error("Failed to get wallet info:", error);
      throw error;
    }
  };

  const getTransactions = async () => {
    if (!breezSdkInstance) throw new Error("SDK not initialized");

    try {
      const response = await breezSdkInstance.listPayments({
        limit: 100,
        offset: 0,
      });

      if (Array.isArray(response)) {
        return response;
      } else if (response?.payments && Array.isArray(response.payments)) {
        return response.payments;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn("Unexpected listPayments response structure:", response);
        return [];
      }
    } catch (error) {
      console.error("Failed to get transactions:", error);
      return [];
    }
  };

  // Add these functions INSIDE the WalletProvider component
  const parseInput = async (input: string) => {
    if (!breezSdkInstance) throw new Error("SDK not initialized");
    return await breezSdkInstance.parse(input);
  };

  const prepareLnurlPay = async (params: any) => {
    if (!breezSdkInstance) throw new Error("SDK not initialized");
    return await breezSdkInstance.prepareLnurlPay(params);
  };

  const lnurlPay = async (params: any) => {
    if (!breezSdkInstance) throw new Error("SDK not initialized");
    return await breezSdkInstance.lnurlPay(params);
  };

  // Replace the parseInput function with manual detection
  // const parseInput = async (input: string) => {
  //   if (!breezSdkInstance) throw new Error('SDK not initialized');

  //   // Manual detection instead of SDK parse (which has WASM issues)
  //   const trimmed = input.trim().toLowerCase();

  //   if (trimmed.startsWith('lnbc') || trimmed.startsWith('lntb')) {
  //     return {
  //       type: 'bolt11Invoice',
  //       rawInput: input,
  //       // Try to extract amount if present (optional)
  //       amountMsat: null
  //     };
  //   } else if (trimmed.startsWith('bc1') || trimmed.startsWith('tb1') || trimmed.startsWith('bcrt1')) {
  //     return {
  //       type: 'bitcoinAddress',
  //       rawInput: input
  //     };
  //   } else if (trimmed.includes('@')) {
  //     return {
  //       type: 'lightningAddress',
  //       rawInput: input
  //     };
  //   } else if (trimmed.startsWith('lnurl')) {
  //     return {
  //       type: 'lnurlPay',
  //       rawInput: input
  //     };
  //   } else {
  //     throw new Error('Invalid input: Unsupported payment type');
  //   }
  // };

  const getSavedMnemonic = () => localStorage.getItem("wallet_mnemonic");
  const saveMnemonic = (mnemonic: string) =>
    localStorage.setItem("wallet_mnemonic", mnemonic);
  const clearMnemonic = () => localStorage.removeItem("wallet_mnemonic");
  const isConnected = () => breezSdkInstance !== null;
  const getSdkInstance = () => breezSdkInstance;

  const prepareSendPayment = async (params: {
    paymentRequest: string;
    amount: bigint;
  }) => {
    // const savedMnemonic = getSavedMnemonic();
    // if (savedMnemonic) {
    //   const sdk = await import("@breeztech/breez-sdk-spark");
    //   await sdk.default();

    //   const breezApiKey = import.meta.env.PRIMAL_BREEZ_API_KEY;
    //   const config = sdk.defaultConfig("mainnet");
    //   config.apiKey = breezApiKey;

    //   await initWallet(savedMnemonic, config);
    // }

    await ensureConnected();
    if (!breezSdkInstance) throw new Error("SDK not initialized");

    return await breezSdkInstance.prepareSendPayment({
      paymentRequest: params.paymentRequest,
      amount: params.amount,
    });
  };

  const sendPayment = async (params: {
    prepareResponse: any;
    options?: any;
  }) => {
    if (!breezSdkInstance) throw new Error("SDK not initialized");

    return await breezSdkInstance.sendPayment({
      prepareResponse: params.prepareResponse,
      ...params.options,
    });
  };

  const value: WalletContextValue = {
    initWallet,
    disconnect: disconnectWallet,
    getWalletInfo,
    getTransactions,
    getSavedMnemonic,
    saveMnemonic,
    clearMnemonic,
    connected: isConnected,
    getSdkInstance,
    // Add these to the value object:
    parseInput,
    prepareLnurlPay,
    lnurlPay,
    prepareSendPayment,
    sendPayment,
    ensureConnected,
  };

  return (
    <WalletContext.Provider value={value}>
      {props.children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
};
