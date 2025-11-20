import { createSignal, For } from 'solid-js';
import Avatar from '../components/Avatar/Avatar';
import styles from './ProfileLinksPage.module.scss';

const SOCIALS = [
  { id: 'x', name: 'X (Twitter)', icon: '/icons/x.svg', placeholder: '@username or URL' },
  { id: 'instagram', name: 'Instagram', icon: '/icons/instagram.svg', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', icon: '/icons/youtube.svg', placeholder: 'channel URL or @handle' },
  { id: 'snapchat', name: 'Snapchat', icon: '/icons/snapchat.svg', placeholder: '@username' },
  { id: 'facebook', name: 'Facebook', icon: '/icons/facebook.svg', placeholder: 'profile URL' },
  { id: 'tiktok', name: 'TikTok', icon: '/icons/tiktok.svg', placeholder: '@username' },
];

const demoUser = {
  name: "tomx",
  email: "jerry@example.org",
  picture: "/avatar-default.svg"
};

export default function ProfileLinksPage() {
  const [links, setLinks] = createSignal<Record<string, string>>({});

  const updateLink = (platform, value) => setLinks(l => ({ ...l, [platform]: value }));

  const handleSave = () => {
    window.alert('Links saved!'); // Replace with your save logic
  };

  return (
    <main class={styles.linksPage}>
      <header class={styles.headerBlock}>
        <Avatar size="md" user={demoUser} />
        <div class={styles.profileInfo}>
          <span class={styles.userName}>{demoUser.name}</span>
          <span class={styles.userEmail}>{demoUser.email}</span>
        </div>
        <h1 class={styles.title}>Edit your LinkMe profile</h1>
        <p class={styles.subtext}>
          Let people discover and connect with you everywhere. Your profile links will display on your public page.
        </p>
      </header>
      <section class={styles.formBlock}>
        <For each={SOCIALS}>
          {(platform) => (
            <div class={styles.linkRow}>
              <img src={platform.icon} width="36" height="36" alt={platform.name} class={styles.iconImage} />
              <div class={styles.linkInputGroup}>
                <label for={platform.id} class={styles.label}>{platform.name}</label>
                <input
                  id={platform.id}
                  type="text"
                  class={styles.input}
                  placeholder={platform.placeholder}
                  value={links()[platform.id] || ''}
                  onInput={e => updateLink(platform.id, e.currentTarget.value)}
                  autocomplete="off"
                />
                <span class={styles.helperText}>
                  Paste your {platform.name} username or full profile link.
                </span>
              </div>
            </div>
          )}
        </For>
      </section>
      <footer class={styles.actions}>
        <button class={styles.save} onClick={handleSave}>Save Links</button>
      </footer>
    </main>
  );
}
