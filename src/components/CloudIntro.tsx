'use client';

import { useEffect, useState } from 'react';
import styles from './CloudIntro.module.css';

export default function CloudIntro() {
    // Use state to unmount after animation to save resources
    const [active, setActive] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setActive(false);
        }, 2800); // Allow full animation to play out
        return () => clearTimeout(timer);
    }, []);

    if (!active) return null;

    return (
        <div className={styles.overlay}>
            {/* Central Mist Pulse */}
            <div className={styles.mistPulse} />

            {/* Layer 1: Fast Foreground Parting */}
            <img src="/cloud.png" alt="" className={`${styles.cloudLayer} ${styles.layerLeftFore}`} />
            <img src="/cloud.png" alt="" className={`${styles.cloudLayer} ${styles.layerRightFore}`} />

            {/* Layer 2: Slower Mid-ground Detail */}
            <img src="/cloud.png" alt="" className={`${styles.cloudLayer} ${styles.layerLeftMid}`} />
            <img src="/cloud.png" alt="" className={`${styles.cloudLayer} ${styles.layerRightMid}`} />
        </div>
    );
}
