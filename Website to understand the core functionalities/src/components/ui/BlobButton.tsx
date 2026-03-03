"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import styles from './BlobButton.module.css';

interface BlobButtonProps {
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    selected?: boolean;
    uppercase?: boolean;
    pill?: boolean;
}

export function BlobButton({
    href,
    onClick,
    children,
    className = "",
    selected = false,
    uppercase = true,
    pill = true
}: BlobButtonProps) {
    const Content = (
        <>
            <span className="relative z-10 flex items-center justify-between w-full gap-2">
                {children}
            </span>
            <span className={styles.blobBtnInner}>
                <span className={styles.blobBtnBlobs}>
                    <span className={styles.blobBtnBlob}></span>
                    <span className={styles.blobBtnBlob}></span>
                    <span className={styles.blobBtnBlob}></span>
                    <span className={styles.blobBtnBlob}></span>
                </span>
            </span>
        </>
    );

    const buttonClasses = cn(
        styles.blobBtn,
        selected && styles.selected,
        !uppercase && styles.noUppercase,
        !pill && styles.noPill,
        "w-fit",
        className
    );

    if (href) {
        return (
            <Link href={href} className={buttonClasses}>
                {Content}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={buttonClasses}>
            {Content}
        </button>
    );
}

export function GooFilter() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'none' }}>
            <defs>
                <filter id="goo">
                    <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"></feGaussianBlur>
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="goo"></feColorMatrix>
                    <feBlend in2="goo" in="SourceGraphic" result="mix"></feBlend>
                </filter>
            </defs>
        </svg>
    );
}
