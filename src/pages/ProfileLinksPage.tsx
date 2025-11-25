import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import styles from "./ProfileLinks.module.scss";

import {
  actions as tActions,
  settings as tSettings,
  toast as tToast,
  upload as tUpload,
} from "../translations";
import { useIntl } from "@cookbook/solid-intl";
import Avatar from "../components/Avatar/Avatar";
import { useProfileContext } from "../contexts/ProfileContext";
import { useAccountContext } from "../contexts/AccountContext";
import { sendProfile } from "../lib/profile";
import { useToastContext } from "../components/Toaster/Toaster";
import { usernameRegex } from "../constants";
import { useNavigate } from "@solidjs/router";
import { triggerImportEvents } from "../lib/notes";
import { APP_ID } from "../App";
import { useSettingsContext } from "../contexts/SettingsContext";
import { useAppContext } from "../contexts/AppContext";
import { unwrap } from "solid-js/store";

export default function ProfileLinksPage() {
  const intl = useIntl();
  const profile = useProfileContext();
  const account = useAccountContext();

  const toast = useToastContext();
  const settings = useSettingsContext();
  const app = useAppContext();
  const navigate = useNavigate();

  const [openSockets, setOpenSockets] = createSignal(false);

  let nameInput: HTMLInputElement | undefined;
  // let userSocialLinks: Record<string, string> = {
  //   instagram: "",
  //   x: "",
  // };

  const setProfile = (hex: string | undefined) => {
    profile?.actions.setProfileKey(hex);
    profile?.actions.clearNotes();
  };

  onMount(() => {
    setOpenSockets(true);
  });

  onCleanup(() => {
    setOpenSockets(false);
  });

  createEffect(() => {
    if (account?.isKeyLookupDone) {
      account.publicKey && setProfile(account.publicKey);
    }
  });

  const handleSave = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!e.target || !account) return false;

    const data = new FormData(e.target as HTMLFormElement);

    let newSocialLinks: Record<string, string> = {};
    ["instagram", "x", "youtube", "snapchat", "facebook", "tiktok"].forEach(
      (key) => {
        const val = data.get(key);
        if (val && typeof val === "string" && val.trim() !== "") {
          newSocialLinks[key] = val.trim();
        }
      }
    );

    const userProfile = profile?.userProfile;
    const oldSocialLinks = userProfile?.userSocialLinks || {};

    const updatedSocialLinks = { ...oldSocialLinks, ...newSocialLinks };
    let updatedProfile = {
      ...userProfile,
      userSocialLinks: updatedSocialLinks,
    };

    // Send entire updated profile including merged social links
    const { success, note } = await sendProfile(
      updatedProfile,
      account?.proxyThroughPrimal || false,
      account.activeRelays,
      account.relaySettings
    );

    if (success) {
      note &&
        triggerImportEvents([note], `import_profile_${APP_ID}`, () => {
          note && profile?.actions.updateProfile(note.pubkey);
          note && account.actions.updateAccountProfile(note.pubkey);
          note && navigate(app?.actions.profileLink(note.pubkey) || "/home");
          toast?.sendSuccess(intl.formatMessage(tToast.updateProfileSuccess));
        });
      return false;
    }

    toast?.sendWarning(intl.formatMessage(tToast.updateProfileFail));
    return false;
  };

  // Display info
  const userData = profile?.userProfile || {};
  const userName = userData.name || userData.displayName || "User";
  const userContact =
    userData.nip05 || account?.publicKey?.slice(0, 12) + "...";

  return (
    <main class={styles.linksPage}>
  <header class={styles.headerBlock}>
    <div class={styles.profileSection}>
      <Avatar size="lg" user={userData} />
      <div class={styles.profileInfo}>
        <span class={styles.userName}>{userName}</span>
        <span class={styles.userEmail}>{userContact}</span>
      </div>
    </div>
    
    <div class={styles.headerContent}>
      <h1 class={styles.title}>Edit your social links</h1>
      <p class={styles.subtext}>
        Connect with people everywhere. Your social links will display on your public profile.
      </p>
    </div>
  </header>

  <section class={styles.formBlock}>
    <form onSubmit={handleSave} class={styles.socialForm}>
      
      <div class={styles.linkInputGroup}>
        <label for="instagram" class={styles.label}>
          <svg class={styles.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Instagram
        </label>
        <input
          id="instagram"
          name="instagram"
          type="text"
          class={styles.input}
          placeholder="username or instagram.com/username"
          value={profile?.userProfile?.userSocialLinks?.instagram || ""}
          autocomplete="off"
        />
      </div>

      <div class={styles.linkInputGroup}>
        <label for="x" class={styles.label}>
          <svg class={styles.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X (Twitter)
        </label>
        <input
          id="x"
          name="x"
          type="text"
          class={styles.input}
          placeholder="username or x.com/username"
          value={profile?.userProfile?.userSocialLinks?.x || ""}
          autocomplete="off"
        />
      </div>

      <div class={styles.linkInputGroup}>
        <label for="youtube" class={styles.label}>
          <svg class={styles.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          YouTube
        </label>
        <input
          id="youtube"
          name="youtube"
          type="text"
          class={styles.input}
          placeholder="Channel URL or youtube.com/@channel"
          value={profile?.userProfile?.userSocialLinks?.youtube || ""}
          autocomplete="off"
        />
      </div>

      <div class={styles.linkInputGroup}>
        <label for="snapchat" class={styles.label}>
          <svg class={styles.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.02.485.044 2.174 1.288 2.932 2.223 3.485.191.113.381.225.562.347.575.387.619.646.62.688.222.949-1.035 1.446-2.36 1.766-.42.1-.765.18-.928.26-.145.073-.34.22-.416.402-.078.186-.06.385.017.57.097.235.268.45.432.612.255.25.577.483.935.75.459.334.98.722 1.35 1.253.16.23.141.421.08.526-.12.21-.44.299-1.018.299-2.174 0-2.753 1.388-4.21 1.388-.625 0-1.146-.249-1.57-.573-.415-.32-.735-.727-1.058-1.133-.323-.406-.596-.785-.959-1.059-.351-.265-.81-.479-1.377-.479s-1.026.214-1.377.479c-.363.274-.636.653-.959 1.059-.323.406-.643.813-1.058 1.133-.424.324-.945.573-1.57.573-1.457 0-2.036-1.388-4.21-1.388-.578 0-.898-.089-1.018-.299-.061-.105-.08-.295.08-.526.37-.531.891-.919 1.35-1.253.358-.267.68-.5.935-.75.164-.162.335-.377.432-.612.077-.185.095-.384.017-.57-.076-.182-.271-.329-.416-.402-.163-.08-.508-.16-.928-.26-1.325-.32-2.582-.817-2.36-1.766 0-.042.045-.301.62-.688.181-.122.371-.234.562-.347.935-.553 2.179-1.311 2.223-3.485.002-.14-.008-.305-.02-.485l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z"/>
          </svg>
          Snapchat
        </label>
        <input
          id="snapchat"
          name="snapchat"
          type="text"
          class={styles.input}
          placeholder="username or snapchat.com/add/username"
          value={profile?.userProfile?.userSocialLinks?.snapchat || ""}
          autocomplete="off"
        />
      </div>

      <div class={styles.linkInputGroup}>
        <label for="facebook" class={styles.label}>
          <svg class={styles.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </label>
        <input
          id="facebook"
          name="facebook"
          type="text"
          class={styles.input}
          placeholder="Profile URL or facebook.com/username"
          value={profile?.userProfile?.userSocialLinks?.facebook || ""}
          autocomplete="off"
        />
      </div>

      <div class={styles.linkInputGroup}>
        <label for="tiktok" class={styles.label}>
          <svg class={styles.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
          TikTok
        </label>
        <input
          id="tiktok"
          name="tiktok"
          type="text"
          class={styles.input}
          placeholder="username or tiktok.com/@username"
          value={profile?.userProfile?.userSocialLinks?.tiktok || ""}
          autocomplete="off"
        />
      </div>

      <footer class={styles.actions}>
        <button type="submit" class={styles.saveButton}>
          <svg class={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Links
        </button>
      </footer>
    </form>
  </section>
</main>

  );
}
