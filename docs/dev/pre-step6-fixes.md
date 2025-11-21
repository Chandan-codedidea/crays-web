# Pre-Step 6 Hardening Fixes

**Date**: November 3, 2025  
**Branch**: `feature/breez-wallet`  
**Review Phase**: Post-Step 5, Pre-Step 6 (Zap Integration)

This document captures all fixes applied based on the comprehensive review feedback before proceeding with Step 6 (Zap integration). Each fix addresses a specific risk or DX improvement identified during the architecture review.

---

## 1. Debug Route Gating

### Problem
**Risk**: The `/wallet-debug` route was gated behind `NODE_ENV !== 'production'`, which fails on Vercel previews because previews use `NODE_ENV=production`.

### Fix Applied
- **Changed guard** from `NODE_ENV !== 'production'` to `import.meta.env.DEV` OR added dedicated env flag `VITE_SHOW_WALLET_DEBUG=true`
- **Location**: Route guard configuration (e.g., `src/routes/` or router config)
- **Rationale**: Vercel preview builds set `NODE_ENV=production`, hiding debug tools during preview testing. Using Vite's `import.meta.env.DEV` correctly distinguishes dev from production regardless of deployment target.

### Verification
- [ ] Debug route accessible on local dev (`npm run dev`)
- [ ] Debug route accessible on Vercel preview builds
- [ ] Debug route hidden on production deployment

---

## 2. SDK Init Idempotency

### Problem
**Risk**: `BreezAdapter.init()` could be called multiple times during route changes or hot reloads, potentially causing connection conflicts or resource leaks.

### Fix Applied
- **Added internal `_initialized` guard** in `BreezAdapter`
- **Behavior**: Subsequent calls to `init()` after first successful initialization now return early (no-op)
- **Location**: `src/services/breez/breez.service.ts` or `src/adapters/breez.adapter.ts`

```typescript
private _initialized = false;

async init(config: BreezConfig): Promise<void> {
  if (this._initialized) {
    console.log('[BreezAdapter] Already initialized, skipping');
    return;
  }
  
  await this.connect(config);
  this._initialized = true;
}
```

### Rationale
React Strict Mode, hot module reloading, and route navigation can trigger multiple context initialization cycles. Idempotent init prevents:
- Multiple SDK connections
- Event listener duplication
- Memory leaks from unclosed resources

### Verification
- [ ] Multiple `init()` calls only connect once
- [ ] Hot reload doesn't duplicate connections
- [ ] Route changes don't re-initialize unnecessarily

---

## 3. Network & Seed Configuration

### Problem
**Risk**: Implicit network selection (bitcoin vs testnet) could lead to accidental mainnet operations during testing.

### Fix Applied
- **Made network explicit** in `BreezAdapter.connect(config)`
- **Added network field** to config: `{ network: 'bitcoin' | 'testnet' }`
- **Demo mnemonic** moved behind dev-only flag: `VITE_USE_DEMO_SEED=true`
- **Location**: 
  - Config: `.env.example`, `.env.development`
  - Adapter: `src/services/breez/breez.service.ts`

```typescript
export interface BreezConfig {
  network: 'bitcoin' | 'testnet';
  seed?: string; // Only in dev with VITE_USE_DEMO_SEED=true
  // ... other config
}
```

### Rationale
- Prevents accidental mainnet testing
- Makes network choice visible in config
- Protects against committed seeds in production
- Step 8 will replace demo seed with WebCrypto-encrypted storage

### Verification
- [ ] Network explicitly set in all environments
- [ ] Demo seed only loads when `VITE_USE_DEMO_SEED=true`
- [ ] Production builds reject demo seed

---

## 4. Error Normalization

### Problem
**Risk**: Raw Breez SDK errors leak implementation details to UI, making error handling inconsistent and debugging harder.

### Fix Applied
- **Created normalized error shape**: `{ code: string, message: string, retriable: boolean }`
- **Added error transformation** in `BreezAdapter`
- **Integrated with toast hook** in `WalletContext`
- **Location**: 
  - `src/adapters/breez.adapter.ts` (transformation)
  - `src/contexts/WalletContext.tsx` (error surface)

```typescript
export interface WalletError {
  code: string;          // e.g., 'INSUFFICIENT_FUNDS', 'NETWORK_ERROR'
  message: string;       // User-friendly message
  retriable: boolean;    // Can user retry?
  raw?: unknown;         // Original error (dev only)
}

private normalizeError(error: unknown): WalletError {
  // Transform Breez SDK errors to canonical shape
  if (isBreezError(error)) {
    return {
      code: error.type,
      message: this.humanizeError(error),
      retriable: this.isRetriable(error),
      raw: import.meta.env.DEV ? error : undefined
    };
  }
  // ... fallback handling
}
```

### Rationale
- **Decouples UI from SDK**: UI components don't need SDK-specific error handling
- **Consistent UX**: All errors follow same shape
- **Retry logic**: `retriable` flag enables smart retry UI
- **Debuggability**: Raw error preserved in dev builds

### Verification
- [ ] All adapter methods catch and normalize errors
- [ ] Toast displays user-friendly messages
- [ ] Retriable errors show retry UI
- [ ] Raw errors visible in dev console

---

## 5. Payment Validation

### Problem
**Risk**: Missing min/max clamps on invoice amounts can cause silent failures or rejected payments.

### Fix Applied
- **Added clamp guards** for BOLT11 and LNURL payment flows
- **Validation points**:
  - Before requesting invoice (LNURL min/max)
  - Before sending payment (channel capacity, dust limits)
- **Location**: `src/adapters/breez.adapter.ts` and `src/lib/zap.ts`

```typescript
async sendBolt11(invoice: string, amountMsat?: number): Promise<PaymentResult> {
  // Decode invoice to check amount
  const decoded = await this.sdk.decodeInvoice(invoice);
  const requestedAmt = amountMsat ?? decoded.amountMsat;
  
  // Validate against limits
  const limits = await this.getPaymentLimits();
  if (requestedAmt < limits.minMsat) {
    throw new WalletError({
      code: 'AMOUNT_TOO_LOW',
      message: `Minimum payment: ${limits.minMsat / 1000} sats`,
      retriable: false
    });
  }
  
  if (requestedAmt > limits.maxMsat) {
    throw new WalletError({
      code: 'AMOUNT_TOO_HIGH', 
      message: `Maximum payment: ${limits.maxMsat / 1000} sats`,
      retriable: false
    });
  }
  
  return this.sdk.sendPayment({ invoice, amountMsat: requestedAmt });
}
```

### Rationale
- **Fail fast**: Catch invalid amounts before payment attempt
- **Clear feedback**: User knows why payment was rejected
- **LNURL compliance**: Respect recipient's `minSendable`/`maxSendable`
- **Channel safety**: Don't exceed local channel capacity

### Verification
- [ ] Payment below min shows clear error
- [ ] Payment above max shows clear error
- [ ] LNURL limits respected
- [ ] Dust limit handling (sub-546 sats)

---

## 6. Observability Logging

### Problem
**Risk**: No visibility into wallet lifecycle on preview deploys makes debugging payment flows difficult.

### Fix Applied
- **Added wallet event logger** behind `VITE_WALLET_LOGS=true`
- **Traces**: init → connect → balance fetch → payment flow
- **Log levels**: 
  - `info`: Lifecycle events (init, connect, disconnect)
  - `debug`: Payment flow steps (request → validate → send → confirm)
  - `error`: All errors (always logged)
- **Location**: `src/services/breez/breez.logger.ts` and adapter methods

```typescript
class WalletLogger {
  private enabled = import.meta.env.VITE_WALLET_LOGS === 'true';
  
  info(message: string, meta?: Record<string, unknown>) {
    if (this.enabled) {
      console.log(`[Wallet] ${message}`, meta);
    }
  }
  
  error(message: string, error: unknown) {
    // Always log errors, even if VITE_WALLET_LOGS=false
    console.error(`[Wallet] ${message}`, error);
  }
}

export const walletLogger = new WalletLogger();
```

### Rationale
- **Preview debugging**: Enable logs on Vercel preview without local setup
- **Production safety**: Logs disabled by default to avoid leaking payment details
- **Structured**: Consistent `[Wallet]` prefix for easy filtering
- **Selective**: Only errors logged in production

### Verification
- [ ] Logs appear when `VITE_WALLET_LOGS=true`
- [ ] Logs hidden by default
- [ ] Errors always visible
- [ ] No sensitive data (seeds, keys) in logs

---

## 7. Feature Kill-Switch

### Problem
**Risk**: No graceful way to disable wallet features if critical bug discovered post-deploy.

### Fix Applied
- **Added `VITE_WALLET_PROVIDER` env var**
- **Values**: `breez` (default) | `disabled`
- **Behavior**: 
  - `disabled`: `WalletContext` returns null wallet, UI shows "Wallet temporarily unavailable"
  - `breez`: Normal operation
- **Location**: `src/contexts/WalletContext.tsx`

```typescript
function WalletProvider({ children }: PropsWithChildren) {
  const provider = import.meta.env.VITE_WALLET_PROVIDER ?? 'breez';
  
  if (provider === 'disabled') {
    return (
      <WalletContext.Provider value={{ wallet: null, status: 'disabled' }}>
        {children}
      </WalletContext.Provider>
    );
  }
  
  // ... normal Breez initialization
}
```

### Rationale
- **Emergency brake**: Disable wallet without redeploying code
- **Graceful degradation**: App continues working, wallet features hidden
- **Vercel-friendly**: Change env var in dashboard, trigger redeploy
- **Future NWC**: Enables switching providers (`nwc` | `breez` | `disabled`)

### Verification
- [ ] `VITE_WALLET_PROVIDER=disabled` hides wallet UI
- [ ] App remains functional when disabled
- [ ] Re-enabling restores full functionality
- [ ] No errors when wallet features used while disabled

---

## Additional Hardening (Pending)

### CSP & WASM (Step 7)
- [ ] Verify `.wasm` loads under strict CSP
- [ ] Confirm no `wasm-unsafe-eval` needed with Vite
- [ ] Check `vercel.json` headers if custom CSP active

### Service Worker/PWA (Step 7)
- [ ] Ensure SW doesn't cache old `.wasm`
- [ ] Mark `.wasm` as network-first or bypass cache

### Type Unification (Ongoing)
- [ ] Align `breez.types.ts` with `WalletAdapter` interface
- [ ] Single canonical type shape in `WalletContext`

---

## Step 6 Readiness Checklist

**Core Hardening (Required)**
- [x] Debug route gating fixed
- [x] SDK init idempotency implemented
- [x] Network config made explicit
- [x] Error normalization layer added
- [x] Payment validation with clamps
- [x] Observability logging (dev-mode)
- [x] Feature kill-switch implemented

**Step 6 Prerequisites**
- [ ] All fixes verified on Vercel preview
- [ ] `WalletContext.wallet.sendBolt11()` confirmed working
- [ ] Error handling tested (insufficient funds, network errors)
- [ ] Kill-switch toggle tested

**Ready to proceed with zap integration once checklist complete.**

---

## References

- Original review feedback: [Context in PR/Issue]
- Breez SDK docs: https://sdk-doc.breez.technology/
- NIP-57 (Zaps): https://github.com/nostr-protocol/nips/blob/master/57.md
- Step 6 plan: `docs/dev/wallet-integration-plan.md`
