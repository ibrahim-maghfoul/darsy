'use client';

import React from 'react';
import Link from 'next/link';
import styles from './DownloadButton.module.css';
import { Download, ArrowLeft } from 'lucide-react';

interface DownloadButtonProps {
    id?: string;
    href: string;
    text: React.ReactNode;
    isSmall?: boolean;
    showArrow?: boolean;
    icon?: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export const DownloadButton = ({ id, href, text, isSmall, showArrow = true, icon, className, onClick }: DownloadButtonProps) => {
    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.preventDefault();
            onClick(e);
        }
    };

    const isExternal = href.startsWith('http') || href.startsWith('//');
    const resolvedClassName = `${styles.blobBtn} ${isSmall ? styles.blobBtnSmall : ''} ${className ?? ''}`;

    const inner = (
        <>
            <div className={styles.blobBtnInner}>
                <div className={styles.blobBtnBlobs}>
                    <span className={styles.blobBtnBlob} />
                    <span className={styles.blobBtnBlob} />
                    <span className={styles.blobBtnBlob} />
                    <span className={styles.blobBtnBlob} />
                </div>
            </div>
            <div className={styles.blobBtnLabel}>
                <div className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-white/10 flex items-center justify-center transition-colors`}>
                    {icon || <Download size={isSmall ? 18 : 22} />}
                </div>
                <span className="tracking-tight text-inherit">
                    <span className="[&_span]:!text-inherit">{text}</span>
                </span>
                {showArrow && (
                    <div className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-white/5 flex items-center justify-center ml-2`}>
                        <ArrowLeft size={isSmall ? 16 : 20} className="rotate-180" />
                    </div>
                )}
            </div>
            {/* Hidden SVG goo filter */}
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    <filter id="goo_download">
                        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="gooResult" />
                        <feBlend in2="gooResult" in="SourceGraphic" result="mix" />
                    </filter>
                </defs>
            </svg>
        </>
    );

    if (isExternal) {
        return (
            <a id={id} href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={resolvedClassName}>
                {inner}
            </a>
        );
    }

    return (
        <Link id={id} href={href} onClick={handleClick} className={resolvedClassName}>
            {inner}
        </Link>
    );
};
