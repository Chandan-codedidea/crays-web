# Wallet & Zap Code Audit

## Date: 2025-11-03

## Current State Analysis

### Existing Wallet/Zap Infrastructure

#### Files with Wallet/Zap Code

1. **src/lib/wallet.ts** (217 lines)
   - Functions: `checkPrimalWalletActive()`, `connectPrimalWalletActive()`, `decodeNWCUri()`, `sendNWCInfoEvent()`, `sendNWCPayInvoice()`
   - Status: NWC (NIP-47) implementation present
   - Type: `NWCConfig` defined

2. **src/lib/zap.ts** (533 lines)
   - Functions: `zapOverNWC()`, `zapNote()`, `zapArticle()`, `zapProfile()`, `zapSubscription()`, `zapDVM()`, `zapStream()`, `getZapEndpoint()`, `canUserReceiveZaps()`, `convertToZap()`
   - Status: Full NIP-57 zap implementation present
   - Supports: WebLN and NWC payment methods

3. **src/components/CustomZap/CustomZap.tsx** (334 lines)
   - Component for custom zap UI
   - Integrates with account context and settings
   - Calls zap functions from src/lib/zap.ts

4. **src/types/primal.d.ts**
   - Types: `NWCConfig`, `ZapOption`, `PrimalZap`, `TopZap`, `NostrUserZaps`
   - Well-defined type system for wallet/zap operations

### UI Entry Points

1. **CustomZap Component** (src/components/CustomZap/CustomZap.tsx)
   - Triggered for note zaps, profile zaps, DVM zaps, stream zaps
   - Props: `note`, `profile`, `dvm`, `stream`, `streamAuthor`
   - Callbacks: `onConfirm`, `onSuccess`, `onFail`, `onCancel`

2. **Note Footer** (referenced in CustomZap.tsx)
   - `lottieDuration()` function for animation timing
   - Zap button triggers CustomZap modal

### Current Payment Flow

```
User clicks Zap → CustomZap modal opens → User selects amount/message
→ zapNote/zapProfile/etc called → NIP-57 zap request created
→ LNURL-pay endpoint fetched → Invoice obtained
→ Payment via WebLN OR NWC (zapOverNWC)
```

### Existing Dependencies (from package.json)

- `@cashu/cashu-ts: 0.9.0` - Cashu ecash (not currently used for zaps)
- `light-bolt11-decoder: 3.1.1` - Lightning invoice decoder
- `nostr-tools: 2.7.0` - Nostr protocol implementation (includes nip04, nip47, nip57)

### Contexts Using Wallet/Zaps

1. **AccountContext** (src/contexts/AccountContext.tsx)
   - Manages user keys, relays, NWC configuration
   - Property: `activeNWC` (current NWC connection)
   - Property: `activeRelays` (user's relay list)

2. **SettingsContext** (src/contexts/SettingsContext.tsx)
   - Manages zap settings
   - Property: `availableZapOptions` (quick zap amounts)

## Proposed Integration Architecture

### Adapter Injection Point

**Recommendation: Create WalletContext**

Create new context: `src/contexts/WalletContext.tsx`
- Manages wallet adapter lifecycle
- Exposes: `getBalance()`, `createInvoice()`, `sendBolt11()`, `payLnurlPay()`
- Wraps App component
- Initializes adapter based on `VITE_WALLET_PROVIDER` env var

### Integration Points

1. **src/lib/zap.ts**
   - Modify: `zapNote()`, `zapArticle()`, `zapProfile()`, `zapSubscription()`, `zapDVM()`, `zapStream()`
   - Change: Replace WebLN/NWC direct calls with WalletContext adapter
   - Keep: All NIP-57 zap request building logic (no changes)
   - Keep: All LNURL-pay endpoint resolution (no changes)

2. **src/components/CustomZap/CustomZap.tsx**
   - No changes required (calls zap.ts functions)

3. **AccountContext**
   - Add: Breez wallet connection status
   - Keep: Existing NWC support for fallback

### Files to Create

```
src/
  wallets/
    adapters/
      WalletAdapter.ts          # Interface definition
      BreezAdapter.ts           # Breez SDK implementation
      NwcAdapter.ts             # NWC fallback (stub initially)
    breez/
      breez.service.ts          # Breez SDK wrapper
      breez.types.ts            # Breez-specific types
  features/
    zaps/
      zap.service.ts            # Refactored zap logic (uses adapter)
  contexts/
    WalletContext.tsx           # New wallet context
docs/
  dev/
    breez-architecture.md       # Architecture documentation
  qa/
    wallet-smoke-tests.md       # Testing checklist
```

### Environment Variables Required

```bash
VITE_WALLET_PROVIDER=breez          # Options: breez, nwc, disabled
VITE_BREEZ_API_KEY=<secret>         # From Breez SDK dashboard
VITE_ENABLE_ZAPS=true               # Feature flag
```

### Risk Assessment

**Low Risk:**
- NIP-57 zap request building (no changes)
- UI components (no changes)
- Type definitions (additions only)

**Medium Risk:**
- Payment execution logic (changing from WebLN/NWC to adapter)
- Wallet initialization (new Breez SDK integration)

**Mitigation:**
- Feature flags to disable wallet if issues arise
- Keep NWC as fallback option
- Comprehensive error handling
- Thorough testing on Vercel previews

## Next Steps

1. Install dependencies: `@breeztech/breez-sdk-spark`
2. Create adapter structure
3. Implement Breez service
4. Wire into zap.ts
5. Test on Vercel preview

---
**Audit completed by:** AI Assistant  
**Review date:** 2025-11-03
