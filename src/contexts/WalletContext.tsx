import { createContext, useContext, createSignal, onMount, onCleanup, JSX } from 'solid-js';
import type { WalletAdapter } from '../wallets/adapters/WalletAdapter';
import { BreezAdapter } from '../wallets/adapters/BreezAdapter';
import { NwcAdapter } from '../wallets/adapters/NwcAdapter';

type PayResult = { id: string; status: 'success' | 'failed'; preimage?: string; txId?: string };
type PayLnurlResult = { id: string; status: 'success' | 'failed' };

export interface CreateInvoiceParams {
  amountMsat: number;
  memo?: string;
}

export interface WalletApi {
  init(): Promise<void>;
  getBalance(): Promise<number>;
  createInvoice(params: CreateInvoiceParams): Promise<string>; // bolt11
  sendBolt11(pr: string): Promise<PayResult>;
  payLnurlPay(
    url: string,
    amountMsat: number,
    comment?: string,
    zapRequestJson?: string
  ): Promise<PayLnurlResult>;
  listPayments(): Promise<any[]>;
  onEvents(cb: (e: any) => void): void;
  providerDisabled?: boolean;
}

// Non-UI accessor for library code (e.g., zaps)
let __walletApi: WalletApi | null = null;
export function setWalletApiForLib(api: WalletApi | null) { __walletApi = api; }
export function getWalletApiForLib(): WalletApi | null { return __walletApi; }

interface WalletState {
  initialized: boolean;
  balance: number | null;
  error: string | null;
  disabled: boolean;
}

interface WalletContextType {
  wallet: () => WalletState;
  getBalance: () => Promise<void>;
  createInvoice: (params: CreateInvoiceParams) => Promise<string>;
  sendPayment: (pr: string) => Promise<PayResult>;
  sendBolt11: (pr: string) => Promise<PayResult>;
  getPayments: () => Promise<any[]>;
  refreshBalance: () => Promise<void>;
  payLnurlPay: (
    url: string,
    amountMsat: number,
    comment?: string,
    zapRequestJson?: string
  ) => Promise<PayLnurlResult>;
  connectWallet: (type: 'breez' | 'nwc', config?: any) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  getAdapter: () => WalletAdapter | null;
}

const WalletContext = createContext<WalletContextType>();

export function WalletProvider(props: { children: JSX.Element }) {
  const [wallet, setWallet] = createSignal<WalletState>({
    initialized: false,
    balance: null,
    error: null,
    disabled: false,
  });

  let adapter: WalletAdapter | null = null;

  const getAdapter = () => adapter;

  const connectWallet = async (type: 'breez' | 'nwc', config?: any) => {
    try {
      if (type === 'breez') {
        adapter = new BreezAdapter();
      } else if (type === 'nwc') {
        adapter = new NwcAdapter();
      } else {
        throw new Error('Unsupported wallet type');
      }

      await adapter.init(config);
      setWallet({ initialized: true, balance: null, error: null, disabled: false });
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setWallet({ initialized: false, balance: null, error: error.message, disabled: false });
      throw error;
    }
  };

  const disconnectWallet = async () => {
    adapter = null;
    setWallet({ initialized: false, balance: null, error: null, disabled: false });
  };

  const getBalance = async () => {
    if (!adapter) throw new Error('Wallet not connected');
    try {
      const balance = await adapter.getBalance();
      setWallet({ ...wallet(), balance });
    } catch (error: any) {
      console.error('Failed to get balance:', error);
      setWallet({ ...wallet(), error: error.message });
      throw error;
    }
  };

  const refreshBalance = async () => {
    await getBalance();
  };

  const createInvoice = async (params: CreateInvoiceParams): Promise<string> => {
    if (!adapter) throw new Error('Wallet not connected');
    return await adapter.createInvoice(params);
  };

  const sendPayment = async (pr: string): Promise<PayResult> => {
    if (!adapter) throw new Error('Wallet not connected');
    return await adapter.sendBolt11(pr);
  };

  const sendBolt11 = async (pr: string): Promise<PayResult> => {
    if (!adapter) throw new Error('Wallet not connected');
    return await adapter.sendBolt11(pr);
  };

  const getPayments = async (): Promise<any[]> => {
    if (!adapter) throw new Error('Wallet not connected');
    return await adapter.listPayments();
  };

  const payLnurlPay = async (
    url: string,
    amountMsat: number,
    comment?: string,
    zapRequestJson?: string
  ): Promise<PayLnurlResult> => {
    if (!adapter) throw new Error('Wallet not connected');
    return await adapter.payLnurlPay(url, amountMsat, comment, zapRequestJson);
  };

  const contextValue = {
    wallet,
    getBalance,
    createInvoice,
    sendPayment,
    sendBolt11,
    getPayments,
    refreshBalance,
    payLnurlPay,
    connectWallet,
    disconnectWallet,
    getAdapter,
  };

  const walletApi: WalletApi = {
    init: async () => { await connectWallet('breez'); },
    getBalance: async () => { 
      await getBalance(); 
      return wallet().balance || 0;
    },
    createInvoice: async (params) => { return await createInvoice(params); },
    sendBolt11: async (pr) => { return await sendBolt11(pr); },
    payLnurlPay: async (url, amountMsat, comment, zapRequestJson) => { 
      return await payLnurlPay(url, amountMsat, comment, zapRequestJson); 
    },
    listPayments: async () => { return await getPayments(); },
    onEvents: (cb) => { /* no-op for now */ },
    providerDisabled: wallet().disabled,
  };
  
  setWalletApiForLib(walletApi);
  onCleanup(() => setWalletApiForLib(null));

  return (
    <WalletContext.Provider value={contextValue}>
      {props.children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Export alias for consistency with zap.ts imports
export { useWallet as useWalletContext };
