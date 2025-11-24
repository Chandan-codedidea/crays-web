import { Component, onMount } from 'solid-js';
import styles from './Imprint.module.scss';
import Branding from '../../components/Branding/Branding';
import { A } from '@solidjs/router';

const Imprint: Component = () => {


    return (
        <div class={styles.imprint}>
            <header class={styles.header}>
                <Branding />
            </header>

            <div class={styles.content}>
                <h1>Imprint</h1>

                <p>
                    Crays Crypto Nomads DAO Association<br />
                    Dammstrasse 16<br />
                    6300 Zug, Switzerland
                </p>

                <p>
                    The Crays Crypto Nomads DAO Association is structured around several key governing bodies to ensure transparent and efficient operations.
                </p>

                <p>
                    Crays is a global, but swiss based association that unites all Crays projects under onestrategic and community-driven umbrella.t’s built on shared values, decentralized coordination, and collective growth.
                </p>

                <p>
                    Today, the Crays Council includes 42 members worldwide with backgrounds in finance,tech, hospitality, and real estate- all working together to drive progress across the ecosystem.
                </p>

                <p>
                    At the top is the "Extended Steering committee", with its President, the General Secretary, the General Secretariat and 20 well-known and well respected industry members from different areas, the highest decision-making authority, where all members collaborate on electing leadership, amending bylaws, and allocating funds. The Executive Board handles the implementation of assembly decisions, manages tokenized assets, and oversees daily operations.
                </p>

                <p>
                    The Advisory Council, composed of representatives from membership groups and industry experts, provides strategic guidance and oversight.
                </p>

                <p>
                    To address specific needs, Specialized Committees focus on critical areas, including Ethics and Governance, Financial Oversight, Tokenization, and Community Development.
                </p>

                <p>
                    Auditors may be appointed to ensure financial transparency and accountability.
                </p>

                <section>
                    <h2>Global Headquarter | Operational Business</h2>
                    <p>
                        Crays Circle Ltd.<br />
                        Unit D134, Office 2905, Floor 29, Sky Tower<br />
                        Shams Abu Dhabi, Abu Dhabi, AlReem Island<br />
                        United Arab Emirates
                    </p>
                    <p>
                        — Kai Thorben biesenbach <br />
                        E-Mail: tb@crays.org
                    </p>
                </section>
            </div>

            <footer class={styles.footer}>

                <div class={styles.copyright}>
                    &copy; {new Date().getFullYear()} Crays. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

export default Imprint;
