import { subsTo } from '../sockets';
export type ReceiptEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};
export type ReceiptCallback = (event: ReceiptEvent) => void;
class ZapReceiptService {
  private callback: ReceiptCallback | null = null;
  private unsubscribe: (() => void) | null = null;
  start() {
    if (this.unsubscribe) {
      return;
    }
    this.unsubscribe = subsTo(
      { kinds: [9735] },
      (event: ReceiptEvent) => {
        if (this.callback) {
          this.callback(event);
        }
      }
    );
  }
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  onReceipt(callback: ReceiptCallback) {
    this.callback = callback;
  }
}
let instance: ZapReceiptService | null = null;
export function getZapReceiptService(): ZapReceiptService {
  if (!instance) {
    instance = new ZapReceiptService();
  }
  return instance;
}
