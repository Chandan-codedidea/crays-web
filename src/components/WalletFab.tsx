import { createSignal, Show } from 'solid-js';
import { getWalletApiForLib } from '../contexts/WalletContext';

export default function WalletFab() {
  const enabled = import.meta.env.VITE_SHOW_WALLET_ENTRY === 'true';
  if (!enabled) return null as any;

  const [open, setOpen] = createSignal(false);
  const [status, setStatus] = createSignal<string>('');
  const [balance, setBalance] = createSignal<number | null>(null);
  const [amountSats, setAmountSats] = createSignal<string>('1000');
  const [invoice, setInvoice] = createSignal<string>('');
  const [payPr, setPayPr] = createSignal<string>('');

  const wallet = () => getWalletApiForLib();

  const providerDisabled = () => Boolean((wallet() as any)?.providerDisabled);
  const providerName = import.meta.env.VITE_WALLET_PROVIDER || 'breez';
  const network = import.meta.env.VITE_BREEZ_NETWORK || 'testnet';
  const hasApiKey = Boolean(import.meta.env.VITE_BREEZ_API_KEY);

  async function doInit() {
    try {
      setStatus('Initializing wallet...');
      await wallet()?.init?.();
      setStatus('Wallet created/loaded ✅');
    } catch (e:any) {
      setStatus(`Init error: ${e?.message || e}`);
    }
  }

  async function doBalance() {
    try {
      setStatus('Fetching balance...');
      const msat = await wallet()?.getBalance?.();
      const sats = typeof msat === 'number' ? Math.floor(msat / 1000) : 0;
      setBalance(sats);
      setStatus('Balance updated ✅');
    } catch (e:any) {
      setStatus(`Balance error: ${e?.message || e}`);
    }
  }

  async function doCreateInvoice() {
    try {
      const sats = parseInt(amountSats() || '0', 10);
      const msat = Math.max(1, sats) * 1000;
      setStatus('Creating invoice...');
      const pr = await wallet()?.createInvoice?.({ amountMsat: msat, description: 'Test invoice' });
      setInvoice(String(pr || ''));
      setStatus('Invoice created ✅');
    } catch (e:any) {
      setStatus(`Invoice error: ${e?.message || e}`);
    }
  }

  async function doPay() {
    try {
      const pr = payPr().trim();
      if (!pr) { setStatus('Enter a BOLT11 invoice'); return; }
      setStatus('Paying...');
      const res = await wallet()?.sendBolt11?.(pr);
      setStatus(res?.status === 'success' ? `Paid ✅ (id: ${res?.id})` : 'Payment failed');
    } catch (e:any) {
      setStatus(`Pay error: ${e?.message || e}`);
    }
  }

  const fabStyle: any = {
    position: 'fixed', bottom: '20px', right: '20px', background: '#5865f2', color: '#fff',
    border: 'none', borderRadius: '50px', padding: '12px 20px', fontSize: '16px',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999
  };
  const modalWrap: any = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 10000
  };
  const modal: any = {
    width: 'min(92vw, 520px)', background: '#181818', color: '#fff', borderRadius: '12px',
    padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
  };
  const row: any = { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' };
  const btn: any = { padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#5865f2', color: '#fff', cursor: 'pointer' };
  const input: any = { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #3a3a3a', background: '#2a2a2a', color: '#fff' };

  return (
    <>
      <button style={fabStyle} onClick={() => setOpen(true)} aria-label="Wallet">
        ⚡ Wallet
      </button>
      <Show when={open()}>
        <div style={modalWrap} onClick={() => setOpen(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '8px' }}>
              <strong>Wallet (Provider: {providerName}, Net: {network})</strong>
              <button style={{ ...btn, background: '#444' }} onClick={() => setOpen(false)}>Close</button>
            </div>

            {/* Diagnostics if wallet provider missing or disabled */}
            {!wallet() || providerDisabled() ? (
              <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', padding:'10px', borderRadius:'8px', 'margin-bottom':'10px' }}>
                <div style={{ 'font-weight':'bold', 'margin-bottom':'6px' }}>Diagnostics</div>
                <div>Wallet API available: {String(!!wallet())}</div>
                <div>Provider disabled: {String(providerDisabled())}</div>
                <div>Breez API key set: {String(hasApiKey)}</div>
                <div style={{ 'margin-top':'6px', 'font-size':'12px', color:'#9aa0a6' }}>
                  Ensure <code>VITE_WALLET_PROVIDER=breez</code>, <code>VITE_BREEZ_NETWORK=testnet</code>, and <code>VITE_BREEZ_API_KEY</code> are set. Then click <strong>Create Wallet (Init)</strong>.
                </div>
              </div>
            ) : null}

            {/* Primary: Create/Load Wallet */}
            <div style={{ 'margin-bottom':'8px' }}><strong>Create / Load</strong></div>
            <div style={row}>
              <button style={{ ...btn, background:'#00c853' }} onClick={doInit}>Create Wallet (Init)</button>
            </div>

            {/* Secondary: Balance */}
            <div style={{ 'margin-top':'12px', 'margin-bottom':'4px' }}><strong>Balance</strong></div>
            <div style={row}>
              <button style={btn} onClick={doBalance}>Get Balance</button>
              <span>{balance() !== null ? `${balance()} sats` : ''}</span>
            </div>

            <div style={{ 'margin-top': '8px', 'margin-bottom': '4px' }}><strong>Create Invoice</strong></div>
            <div style={row}>
              <input style={input} type="number" min="1" value={amountSats()} onInput={(e:any)=>setAmountSats(e.currentTarget.value)} placeholder="Amount (sats)" />
              <button style={btn} onClick={doCreateInvoice}>Create</button>
            </div>
            <div style={{ ...input, padding: '8px', 'margin-bottom': '8px' }}>{invoice() || '—'}</div>

            <div style={{ 'margin-top': '8px', 'margin-bottom': '4px' }}><strong>Pay Invoice</strong></div>
            <div style={row}>
              <input style={input} value={payPr()} onInput={(e:any)=>setPayPr(e.currentTarget.value)} placeholder="Paste BOLT11" />
              <button style={btn} onClick={doPay}>Pay</button>
            </div>

            <div style={{ 'margin-top': '10px', color: '#9aa0a6', 'font-size': '12px' }}>{status()}</div>
          </div>
        </div>
      </Show>
    </>
  );
}
