import { A, useLocation, useNavigate } from '@solidjs/router';
import { Component, Show } from 'solid-js';
import { hookForDev } from '../../lib/devTools';

import styles from './NavLink.module.scss';

const NavLink: Component<{
  id?: string,
  to: string,
  label?: string,
  icon: string,
  bubble?: () => number,
  hiddenOnSmallScreens?: boolean,
  isPhone?: boolean,
  isExternal?: boolean,
}> = (props) => {
  const location = useLocation();

  const scrollIfInactive = (e: Event) => {
    if (props.to === location.pathname) {
      e.preventDefault();

      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }
  }

  const bubbleClass = () => {
    if (!props.bubble || props.bubble() < 10) {
      return '';
    }

    if (props.bubble() < 100) {
      return styles.doubleSize;
    }

    return styles.tripleSize;
  }

  const isExternal = () => props.isExternal || props.to.startsWith('http://') || props.to.startsWith('https://');

  return (
    <div id={props.id} class={`${styles.navLink} ${props.isPhone ? styles.phoneNavLink : ''}`}>
      <Show
        when={isExternal()}
        fallback={
          <A
            href={props.to}
            activeClass={styles.active}
            inactiveClass={styles.inactive}
            onClick={scrollIfInactive}
          >
            <div class={styles[props.icon]}></div>
            <Show when={props.label}>
              <div class={styles.label}>{props.label}</div>
            </Show>
          </A>
        }
      >
        <a
          href={props.to}
          target="_blank"
          rel="noopener noreferrer"
          class={styles.inactive}
        >
          <div class={styles[props.icon]}></div>
          <Show when={props.label}>
            <div class={styles.label}>{props.label}</div>
          </Show>
        </a>
      </Show>
      <Show when={props.bubble && props.bubble() > 0}>
        <div class={`${styles.bubble} ${bubbleClass()}`}>
          <div>{props.bubble && props.bubble() < 100 ? props.bubble() : '99+'}</div>
        </div>
      </Show>
    </div>
  )
}

export default hookForDev(NavLink);

