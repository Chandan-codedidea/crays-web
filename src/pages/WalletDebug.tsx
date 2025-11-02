import { Component, createSignal, Show } from 'solid-js';
import { BreezAdapter } from '../wallets/breez/breez.adapter';

// Dev-only wallet debug interface
if (!import.meta.env.DEV && import.meta.env.VITE_SHOW_WALLET_DEBUG !== 'true') {
  throw new Error('WalletDebug component should not be imported in production');
}

const WalletDebug: Component = () => {
  // Guard: return null if neither dev mode nor debug flag is set
  if (!import.meta.env.DEV && import.meta.env.VITE_SHOW_WALLET_DEBUG !== 'true') {
    return null;
  }

  const [breezAdapter] = createSignal(new BreezAdapter());
  const [result, setResult] = createSignal<string>('');
  const [balance, setBalance] = createSignal<string>('');
  const [invoice, setInvoice] = createSignal<string>('');
  const [bolt11Input, setBolt11Input] = createSignal<string>('');
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  const handleInitializeBreez = async () => {
    console.log('[WalletDebug] Initializing Breez...');
    setIsLoading(true);
    setResult('');

    try {
      await breezAdapter().initialize();
      const msg = 'Breez initialized successfully';
      console.log('[WalletDebug]', msg);
      setResult(msg);
    } catch (error) {
      const errorMsg = `Failed to initialize Breez: ${error}`;
      console.error('[WalletDebug]', errorMsg, error);
      setResult(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowBalance = async () => {
    console.log('[WalletDebug] Fetching balance...');
    setIsLoading(true);
    setResult('');

    try {
      const balanceResult = await breezAdapter().getBalance();
      const msg = `Balance: ${JSON.stringify(balanceResult)}`;
      console.log('[WalletDebug]', msg);
      setBalance(msg);
      setResult(msg);
    } catch (error) {
      const errorMsg = `Failed to get balance: ${error}`;
      console.error('[WalletDebug]', errorMsg, error);
      setResult(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    console.log('[WalletDebug] Creating invoice...');
    setIsLoading(true);
    setResult('');

    try {
      // Create invoice for 1000 sats
      const invoiceResult = await breezAdapter().createInvoice(1000, 'Debug test invoice');
      const msg = `Invoice created: ${invoiceResult}`;
      console.log('[WalletDebug]', msg);
      setInvoice(invoiceResult);
      setResult(msg);
    } catch (error) {
      const errorMsg = `Failed to create invoice: ${error}`;
      console.error('[WalletDebug]', errorMsg, error);
      setResult(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    console.log('[WalletDebug] Paying invoice:', bolt11Input());
    setIsLoading(true);
    setResult('');

    try {
      const paymentResult = await breezAdapter().payInvoice(bolt11Input());
      const msg = `Payment successful: ${JSON.stringify(paymentResult)}`;
      console.log('[WalletDebug]', msg);
      setResult(msg);
      setBolt11Input('');
    } catch (error) {
      const errorMsg = `Failed to pay invoice: ${error}`;
      console.error('[WalletDebug]', errorMsg, error);
      setResult(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      'max-width': '800px',
      margin: '0 auto',
      'font-family': 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{
        'margin-bottom': '20px'
      }}>
        Wallet Debug Interface
      </h1>
      
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffc107',
        padding: '10px',
        'border-radius': '4px',
        'margin-bottom': '20px'
      }}>
        ⚠️ Development Only - Not available in production
      </div>

      <div style={{
        display: 'flex',
        gap: '10px',
        'margin-bottom': '20px'
      }}>
        <button
          onClick={handleInitializeBreez}
          disabled={isLoading()}
          style={{
            padding: '10px 20px',
            'background-color': '#007bff',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: isLoading() ? 'not-allowed' : 'pointer',
            'font-size': '14px'
          }}
        >
          Initialize Breez
        </button>

        <button
          onClick={handleShowBalance}
          disabled={isLoading()}
          style={{
            padding: '10px 20px',
            'background-color': '#28a745',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: isLoading() ? 'not-allowed' : 'pointer',
            'font-size': '14px'
          }}
        >
          Show Balance
        </button>

        <button
          onClick={handleCreateInvoice}
          disabled={isLoading()}
          style={{
            padding: '10px 20px',
            'background-color': '#17a2b8',
            color: 'white',
            border: 'none',
            'border-radius': '4px',
            cursor: isLoading() ? 'not-allowed' : 'pointer',
            'font-size': '14px'
          }}
        >
          Create Invoice (1000 sats)
        </button>
      </div>

      <div style={{
        'margin-bottom': '20px'
      }}>
        <label style={{
          display: 'block',
          'margin-bottom': '8px',
          'font-weight': 'bold'
        }}>
          Pay Lightning Invoice:
        </label>
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            placeholder="Paste bolt11 invoice here"
            value={bolt11Input()}
            onInput={(e) => setBolt11Input(e.currentTarget.value)}
            style={{
              flex: '1',
              padding: '10px',
              border: '1px solid #ccc',
              'border-radius': '4px',
              'font-family': 'monospace',
              'font-size': '12px'
            }}
          />
          <button
            onClick={handlePayInvoice}
            disabled={isLoading() || !bolt11Input()}
            style={{
              padding: '10px 20px',
              'background-color': '#dc3545',
              color: 'white',
              border: 'none',
              'border-radius': '4px',
              cursor: (isLoading() || !bolt11Input()) ? 'not-allowed' : 'pointer',
              'font-size': '14px'
            }}
          >
            Pay Invoice
          </button>
        </div>
      </div>

      <Show when={isLoading()}>
        <div style={{
          padding: '15px',
          background: '#e7f3ff',
          border: '1px solid #b3d9ff',
          'border-radius': '4px',
          'margin-bottom': '20px'
        }}>
          Loading...
        </div>
      </Show>

      <Show when={balance()}>
        <div style={{
          'margin-bottom': '20px'
        }}>
          <strong>Current Balance:</strong>
          <div style={{
            padding: '15px',
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            'border-radius': '4px',
            'font-family': 'monospace',
            'white-space': 'pre-wrap',
            'word-break': 'break-all'
          }}>
            {balance()}
          </div>
        </div>
      </Show>

      <Show when={invoice()}>
        <div style={{
          'margin-bottom': '20px'
        }}>
          <strong>Generated Invoice:</strong>
          <div style={{
            padding: '15px',
            background: '#d1ecf1',
            border: '1px solid #bee5eb',
            'border-radius': '4px',
            'font-family': 'monospace',
            'white-space': 'pre-wrap',
            'word-break': 'break-all',
            'font-size': '12px'
          }}>
            {invoice()}
          </div>
        </div>
      </Show>

      <Show when={result()}>
        <div style={{
          'margin-bottom': '20px'
        }}>
          <strong>Result:</strong>
          <div style={{
            padding: '15px',
            background: result().includes('Failed') ? '#f8d7da' : '#d4edda',
            border: result().includes('Failed') ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
            'border-radius': '4px',
            'font-family': 'monospace',
            'white-space': 'pre-wrap',
            'word-break': 'break-all',
            'font-size': '12px'
          }}>
            {result()}
          </div>
        </div>
      </Show>

      <div style={{
        'margin-top': '30px',
        padding: '15px',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        'border-radius': '4px'
      }}>
        <strong>Console Output:</strong>
        <p style={{
          'margin-top': '8px',
          color: '#6c757d'
        }}>
          All operations are logged to the browser console. Open DevTools to see detailed logs.
        </p>
      </div>
    </div>
  );
};

export default WalletDebug;
