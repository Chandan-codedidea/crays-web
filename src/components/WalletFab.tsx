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

  async function doInit() {
    try {
      setStatus('Initializing...');
      await wallet()?.init?.();
      setStatus('Initialized ✅');
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

  const fabStyle = {
    position: 'fixed', right: '16px', bottom: '16px', zIndex: 9999,
    background: '#111', color: '#fff', borderRadius: '999px', padding: '10px 14px',
    fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  } as any;

  const modalWrap: any = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 10000
  };
  const modal: any = {
    width: 'min(92vw, 520px)', background: '#181818', color: '#fff', borderRadius: '12px',
    padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
  };
  const row: any = { display: 'flex', gap: '8px', margin: '8px 0', alignItems: 'center' };
  const input: any = { flex: 1, background: '#222', color: '#fff', border: '1px solid #333',
    borderRadius: '8px', padding: '8px' };
  const btn: any = { background: '#2d68ff', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer' };

  return (
    <>
      <button style={fabStyle} onClick={() => setOpen(true)} aria-label="Wallet">
        ⚡ Wallet
      </button>
      <Show when={open()}>
        <div style={modalWrap} onClick={() => setOpen(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>Wallet (Testnet)</strong>
              <button style={{ ...btn, background: '#444' }} onClick={() => setOpen(false)}>Close</button>
            </div>

            <div style={row}>
              <button style={btn} onClick={doInit}>Initialize</button>
              <button style={btn} onClick={doBalance}>Get Balance</button>
              <span>{balance() !== null ? `${balance()} sats` : ''}</span>
            </div>

            <div style={{ marginTop: '8px', marginBottom: '4px' }}><strong>Create Invoice</strong></div>
            <div style={row}>
              <input style={input} type="number" min="1" value={amountSats()} onInput={(e:any)=>setAmountSats(e.currentTarget.value)} placeholder="Amount (sats)" />
              <button style={btn} onClick={doCreateInvoice}>Create</button>
            </div>
            <div style={{ ...input, padding: '8px', marginBottom: '8px' }}>{invoice() || '—'}</div>

            <div style={{ marginTop: '8px', marginBottom: '4px' }}><strong>Pay Invoice</strong></div>
            <div style={row}>
              <input style={input} value={payPr()} onInput={(e:any)=>setPayPr(e.currentTarget.value)} placeholder="Paste BOLT11" />
              <button style={btn} onClick={doPay}>Pay</button>
            </div>

            <div style={{ marginTop: '10px', color: '#9aa0a6', fontSize: '12px' }}>{status()}</div>
          </div>
        </div>
      </Show>
    </>
  );
}
