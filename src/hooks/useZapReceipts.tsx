import { createEffect, onCleanup } from 'solid-js';
import { useAccountContext } from '../contexts/AccountContext';
import { getZapReceiptService } from '../lib/zap-receipts';
import { useToastContext } from '../components/Toaster/Toaster';

export function useZapReceipts() {
  const account = useAccountContext();
  const toaster = useToastContext();

  createEffect(() => {
    const publicKey = account?.publicKey;
    const relays = account?.activeRelays || [];

    if (!publicKey || relays.length === 0) {
      return;
    }

    const service = getZapReceiptService();
    
    // Register callback for receipt events
    const unsubscribe = service.onReceipt((event) => {
      // Parse zap amount from bolt11 tag
      const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');
      const descriptionTag = event.tags.find(t => t[0] === 'description');
      
      let amount = 0;
      let sender = 'Unknown';
      
      if (descriptionTag && descriptionTag[1]) {
        try {
          const zapRequest = JSON.parse(descriptionTag[1]);
          sender = zapRequest.pubkey?.substring(0, 8) || 'Unknown';
        } catch (e) {
          console.error('Failed to parse zap request', e);
        }
      }
      
      toaster?.sendSuccess(
        `⚡ Zap Received!`,
        `You received ${amount > 0 ? (amount / 1000).toFixed(0) : '?'} sats from ${sender}`,
        'check',
        5000
      );
    });
    
    // Start listening
    service.start(publicKey, relays);
    
    // Cleanup
    onCleanup(() => {
      unsubscribe();
      service.stop();
    });
  });
}
