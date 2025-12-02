// src/components/SubscribeButton.tsx
import { Show, createSignal } from "solid-js";
import SubscribeModal from "../pages/SubscribeModal";
const SubscribeButton = (props: { creatorPubkey: string }) => {
  const [isModalOpen, setModalOpen] = createSignal(false);
  return (
    <>
      <button onClick={() => setModalOpen(true)}>
        Subscribe to access
      </button>
      <Show when={isModalOpen()}>
        <SubscribeModal
          isOpen={isModalOpen()}
          onClose={() => setModalOpen(false)}
          targetPubkey={props.creatorPubkey}
          // Pass monthlyPrice and bundles as needed from context/store
        />
      </Show>
    </>
  );
};

export default SubscribeButton;
