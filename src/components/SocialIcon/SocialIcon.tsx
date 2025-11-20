// SocialIcon.tsx
import { Component } from 'solid-js';
import { SOCIALS } from './socialLinks';

export const SocialIcon: Component<{ platform: string }> = (props) => {
  const entry = SOCIALS.find(s => s.id === props.platform);
  if (!entry) return null;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d={entry.svg} />
    </svg>
  );
};
