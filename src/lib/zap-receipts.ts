import { subsTo } from './relays';

type ReceiptEvent = {
  kind: number;
  pubkey: string;
  content: string;
  tags: string[][];
  created_at: number;
};

type ReceiptCallback = (event: ReceiptEvent) => void;

class ZapReceiptService {
  private callbacks: Set<ReceiptCallback> = new Set();
  private unsubscribe: (() => void) | null = null;

  start(publicKey: string, relays: string[]) {
    if (this.unsubscribe) {
      return;
    }
    this.unsubscribe = subsTo(
      'zap-receipts',
      { kinds: [9735], '#p': [publicKey] },
      (event: ReceiptEvent) => {
        this.notifyCallbacks(event);
      },
      relays
    );
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  onReceipt(callback: ReceiptCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(event: ReceiptEvent) {
    this.callbacks.forEach((callback) => {
      callback(event);
    });
  }
}

export const zapReceiptService = new ZapReceiptService();
export { ZapReceiptService };
export type { ReceiptEvent, ReceiptCallback };
