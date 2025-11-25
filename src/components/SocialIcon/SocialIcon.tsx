// SocialIcon.tsx
import { SOCIALS } from './socialLinks';

export function SocialIcon(props: { platform: string }) {
  const social = SOCIALS.find(s => s.id === props.platform);
  
  if (!social) return null;
  
  return (
    <div 
      class="socialIconWrapper"
      data-platform={props.platform}
      innerHTML={social.svg}
      title={social.name}
    />
  );
}
