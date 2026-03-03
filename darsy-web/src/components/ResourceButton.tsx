'use client';

import React from 'react';
import styles from './ResourceButton.module.css';
import { Download } from 'lucide-react';

interface ResourceButtonProps {
    href: string;
    text: React.ReactNode;
}

export const ResourceButton = ({ href, text }: ResourceButtonProps) => {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.button}
        >
            <span className={styles.buttonText}>{text}</span>
            <span className={styles.buttonIcon}>
                <Download size={20} className={styles.svg} />
            </span>
        </a>
    );
};
