import { createContext, useContext, createSignal, onMount, JSX } from 'solid-js';
import type { WalletAdapter } from '../wallets/adapters/WalletAdapter';
import { BreezAdapter } from '../wallets/adapters/BreezAdapter';
import { NwcAdapter } from '../wallets/adapters/NwcAdapter';

type PayResult = { id: string; status: 'success' | 'failed'; preimage?: string };
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

interface WalletState {
  initialized: boolean;
  balance: number | null;
  error: string | null;
  disabled: boolean;
}

interface Payment {
  id: string;
  amount: number;
  timestamp: number;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
}

interface PayLnurlPayParams {
  lnurlPay: string;
  amount: number;
  comment?: string;
}

interface WalletContextType {
  state: () => WalletState;
  getBalance: () => Promise<number>;
  createInvoice: (params: CreateInvoiceParams) => Promise<string>;
  sendPayment: (invoice: string) => Promise<string>;
  sendBolt11: (invoice: string) => Promise<string>;
  getPayments: () => Promise<Payment[]>;
  refreshBalance: () => Promise<void>;
  payLnurlPay: (params: PayLnurlPayParams) => Promise<string>;
  connectWallet: (walletUri: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  getAdapter: () => WalletAdapter | null;
}

const WalletContext = createContext<WalletContextType>();

export function WalletProvider(props: { children: JSX.Element }) {
  const [state, setState] = createSignal<WalletState>({
    initialized: false,
    balance: null,
    error: null,
    disabled: false,
  });

  let adapter: WalletAdapter | null = null;

  onMount(async () => {
    await initializeAdapter();
  });

  async function initializeAdapter() {
    try {
      const storedConfig = localStorage.getItem('walletConfig');
      if (!storedConfig) {
        setState({ ...state(), initialized: true });
        return;
      }

      const config = JSON.parse(storedConfig);
      
      if (config.type === 'breez') {
        adapter = new BreezAdapter();
        await adapter.initialize(config);
      } else if (config.type === 'nwc') {
        adapter = new NwcAdapter();
        await adapter.initialize(config);
      }

      if (adapter) {
        const balance = await adapter.getBalance();
        setState({ initialized: true, balance, error: null, disabled: false });
      }
    } catch (err) {
      console.error('Failed to initialize wallet:', err);
      setState({ 
        initialized: true, 
        balance: null, 
        error: err instanceof Error ? err.message : 'Unknown error',
        disabled: false 
      });
    }
  }

  async function connectWallet(walletUri: string) {
    try {
      setState({ ...state(), error: null });
      
      let walletType: 'breez' | 'nwc';
      let config: any;

      if (walletUri.startsWith('nostr+walletconnect://')) {
        walletType = 'nwc';
        adapter = new NwcAdapter();
        config = { type: 'nwc', uri: walletUri };
      } else {
        walletType = 'breez';
        adapter = new BreezAdapter();
        config = { type: 'breez', mnemonic: walletUri };
      }

      await adapter.initialize(config);
      localStorage.setItem('walletConfig', JSON.stringify(config));
      
      const balance = await adapter.getBalance();
      setState({ initialized: true, balance, error: null, disabled: false });
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      adapter = null;
      setState({ 
        ...state(), 
        error: err instanceof Error ? err.message : 'Failed to connect wallet' 
      });
      throw err;
    }
  }

  async function disconnectWallet() {
    try {
      if (adapter) {
        await adapter.disconnect();
        adapter = null;
      }
      localStorage.removeItem('walletConfig');
      setState({ initialized: true, balance: null, error: null, disabled: false });
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      throw err;
    }
  }

  async function getBalance(): Promise<number> {
    if (!adapter) {
      throw new Error('No wallet connected');
    }
    try {
      const balance = await adapter.getBalance();
      setState({ ...state(), balance });
      return balance;
    } catch (err) {
      console.error('Failed to get balance:', err);
      throw err;
    }
  }

  async function refreshBalance() {
    await getBalance();
  }

  async function createInvoice(params: CreateInvoiceParams): Promise<string> {
    if (!adapter) {
      throw new Error('No wallet connected');
    }
    try {
      return await adapter.createInvoice(params);
    } catch (err) {
      console.error('Failed to create invoice:', err);
      throw err;
    }
  }

  async function sendPayment(invoice: string): Promise<string> {
    if (!adapter) {
      throw new Error('No wallet connected');
    }
    try {
      const result = await adapter.sendPayment(invoice);
      await refreshBalance();
      return result;
    } catch (err) {
      console.error('Failed to send payment:', err);
      throw err;
    }
  }

  async function sendBolt11(invoice: string): Promise<string> {
    return sendPayment(invoice);
  }

  async function getPayments(): Promise<Payment[]> {
    if (!adapter) {
      throw new Error('No wallet connected');
    }
    try {
      return await adapter.getPayments();
    } catch (err) {
      console.error('Failed to get payments:', err);
      throw err;
    }
  }

  async function payLnurlPay(params: PayLnurlPayParams): Promise<string> {
    if (!adapter) {
      throw new Error('No wallet connected');
    }
    try {
      // Fetch LNURL-pay endpoint
      const lnurlDecoded = decodeLnurl(params.lnurlPay);
      const response = await fetch(lnurlDecoded);
      const data = await response.json();

      if (data.status === 'ERROR') {
        throw new Error(data.reason || 'LNURL-pay request failed');
      }

      // Validate amount
      const amountMsat = params.amount * 1000;
      if (amountMsat < data.minSendable || amountMsat > data.maxSendable) {
        throw new Error(`Amount must be between ${data.minSendable / 1000} and ${data.maxSendable / 1000} sats`);
      }

      // Request invoice
      const callbackUrl = new URL(data.callback);
      callbackUrl.searchParams.set('amount', amountMsat.toString());
      if (params.comment && data.commentAllowed) {
        callbackUrl.searchParams.set('comment', params.comment.substring(0, data.commentAllowed));
      }

      const invoiceResponse = await fetch(callbackUrl.toString());
      const invoiceData = await invoiceResponse.json();

      if (invoiceData.status === 'ERROR') {
        throw new Error(invoiceData.reason || 'Failed to get invoice');
      }

      // Pay the invoice
      return await sendPayment(invoiceData.pr);
    } catch (err) {
      console.error('Failed to pay LNURL-pay:', err);
      throw err;
    }
  }

  function decodeLnurl(lnurl: string): string {
    if (lnurl.toLowerCase().startsWith('lnurl')) {
      // Bech32 decode
      const { words } = bech32Decode(lnurl);
      const data = fromWords(words);
      return new TextDecoder().decode(new Uint8Array(data));
    }
    return lnurl;
  }

  function bech32Decode(str: string): { prefix: string; words: number[] } {
    const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    str = str.toLowerCase();
    const pos = str.lastIndexOf('1');
    const prefix = str.substring(0, pos);
    const data = str.substring(pos + 1, str.length - 6);
    const words = [];
    for (let i = 0; i < data.length; i++) {
      words.push(CHARSET.indexOf(data[i]));
    }
    return { prefix, words };
  }

  function fromWords(words: number[]): number[] {
    const bytes = [];
    let value = 0;
    let bits = 0;
    for (const word of words) {
      value = (value << 5) | word;
      bits += 5;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((value >> bits) & 0xff);
        value &= (1 << bits) - 1;
      }
    }
    return bytes;
  }

  function getAdapter(): WalletAdapter | null {
    return adapter;
  }

  const contextValue: WalletContextType = {
    state,
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
