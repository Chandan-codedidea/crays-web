import { createContext, useContext, createSignal, onMount, JSX } from 'solid-js';
import type { WalletAdapter } from '../lib/wallet/types';
import { BreezAdapter } from '../lib/wallet/adapters/BreezAdapter';
import { LndAdapter } from '../lib/wallet/adapters/LndAdapter';

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

interface CreateInvoiceParams {
  amount: number;
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
  sendBolt11: (bolt11: string) => Promise<string>;
  payLnurlPay: (params: PayLnurlPayParams) => Promise<string>;
  listPayments: () => Promise<Payment[]>;
}

const WalletContext = createContext<WalletContextType>();

export function WalletProvider(props: { children: JSX.Element }) {
  const [initialized, setInitialized] = createSignal(false);
  const [balance, setBalance] = createSignal<number | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [disabled, setDisabled] = createSignal(false);
  
  let adapter: WalletAdapter | null = null;

  // Initialize wallet adapter based on environment variable
  const initializeAdapter = async () => {
    try {
      const walletProvider = import.meta.env.VITE_WALLET_PROVIDER;
      
      if (!walletProvider) {
        throw new Error('VITE_WALLET_PROVIDER environment variable is not set');
      }

      // Check if wallet is disabled
      if (walletProvider.toLowerCase() === 'disabled') {
        setDisabled(true);
        setInitialized(true);
        setBalance(0);
        setError(null);
        return;
      }

      // Instantiate adapter based on provider type
      switch (walletProvider.toLowerCase()) {
        case 'breez':
          adapter = new BreezAdapter();
          break;
        case 'lnd':
          adapter = new LndAdapter();
          break;
        default:
          throw new Error(`Unsupported wallet provider: ${walletProvider}`);
      }

      // Initialize the adapter
      await adapter.initialize();
      
      // Fetch initial balance
      const initialBalance = await adapter.getBalance();
      setBalance(initialBalance);
      
      setInitialized(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize wallet adapter';
      setError(errorMessage);
      setInitialized(false);
      console.error('Wallet adapter initialization error:', err);
    }
  };

  onMount(() => {
    initializeAdapter();
  });

  const getBalance = async (): Promise<number> => {
    try {
      // Return 0 if wallet is disabled
      if (disabled()) {
        return 0;
      }

      if (!adapter) {
        throw new Error('Wallet adapter not initialized');
      }
      
      const currentBalance = await adapter.getBalance();
      setBalance(currentBalance);
      setError(null);
      return currentBalance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
      throw err;
    }
  };

  const createInvoice = async (params: CreateInvoiceParams): Promise<string> => {
    try {
      // Return empty string if wallet is disabled
      if (disabled()) {
        console.warn('Wallet is disabled: createInvoice called but no-op');
        return '';
      }

      if (!adapter) {
        throw new Error('Wallet adapter not initialized');
      }
      
      const invoice = await adapter.createInvoice(params.amount, params.description);
      setError(null);
      return invoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMessage);
      throw err;
    }
  };

  const sendBolt11 = async (bolt11: string): Promise<string> => {
    try {
      // Return failed status if wallet is disabled
      if (disabled()) {
        console.warn('Wallet is disabled: sendBolt11 called but no-op');
        throw new Error('Wallet is disabled');
      }

      if (!adapter) {
        throw new Error('Wallet adapter not initialized');
      }
      
      const paymentId = await adapter.sendBolt11(bolt11);
      setError(null);
      
      // Refresh balance after payment
      await getBalance();
      
      return paymentId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send payment';
      setError(errorMessage);
      throw err;
    }
  };

  const payLnurlPay = async (params: PayLnurlPayParams): Promise<string> => {
    try {
      // Return failed status if wallet is disabled
      if (disabled()) {
        console.warn('Wallet is disabled: payLnurlPay called but no-op');
        throw new Error('Wallet is disabled');
      }

      if (!adapter) {
        throw new Error('Wallet adapter not initialized');
      }
      
      const paymentId = await adapter.payLnurlPay(params.lnurlPay, params.amount, params.comment);
      setError(null);
      
      // Refresh balance after payment
      await getBalance();
      
      return paymentId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pay LNURL';
      setError(errorMessage);
      throw err;
    }
  };

  const listPayments = async (): Promise<Payment[]> => {
    try {
      // Return empty array if wallet is disabled
      if (disabled()) {
        return [];
      }

      if (!adapter) {
        throw new Error('Wallet adapter not initialized');
      }
      
      const payments = await adapter.listPayments();
      setError(null);
      return payments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list payments';
      setError(errorMessage);
      throw err;
    }
  };

  const state = () => ({
    initialized: initialized(),
    balance: balance(),
    error: error(),
    disabled: disabled(),
  });

  const contextValue: WalletContextType = {
    state,
    getBalance,
    createInvoice,
    sendBolt11,
    payLnurlPay,
    listPayments,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {props.children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
