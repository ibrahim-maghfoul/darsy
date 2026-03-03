'use client';

import React, { useState } from 'react';
import styles from './DeepLiquidCard.module.css';
import Link from 'next/link';

interface DeepLiquidCardProps {
    title?: string;
    subtitle?: string;
    price?: string;
    image?: string;
    description?: React.ReactNode;
    date?: string;
    href?: string;
}

const DeepLiquidCard: React.FC<DeepLiquidCardProps> = ({
    title = "Melodia Auditorium",
    subtitle = "Redefining Jakarta",
    price = "IDR 50,000",
    image = "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1000",
    description,
    date = "Friday Aug, 25",
    href,
}) => {
    const [count, setCount] = useState(1);

    const increase = () => setCount((prev) => prev + 1);
    const decrease = () => setCount((prev) => (prev > 1 ? prev - 1 : 1));

    const cardContent = (
        <div className={styles.card}>
            {/* Decorative corners */}
            <div className={styles.cornerTl}></div>
            <div className={styles.cornerTlSide}></div>
            <div className={styles.cornerBr}></div>
            <div className={styles.cornerBrSide}></div>

            {/* Top pill (Price) */}
            <div className={styles.pricePill}>{price}</div>

            {/* Top Text */}
            <div className={styles.topText}>
                <div className={styles.title}>{title}</div>
                <div className={styles.subtitle}>{subtitle}</div>
            </div>

            {/* Image */}
            <div
                className={styles.image}
                style={{ backgroundImage: `url('${image}')` }}
            ></div>

            {/* Bottom Counter / Action Pill */}
            <div className={styles.counter} style={href ? { justifyContent: 'center' } : {}}>
                {href ? (
                    <span className={styles.moreText}>
                        PLUS
                    </span>
                ) : (
                    <>
                        <button className={styles.btn} onClick={decrease} aria-label="Decrease count">−</button>
                        <div id="count">{count}</div>
                        <button className={`${styles.btn} ${styles.btnPlus}`} onClick={increase} aria-label="Increase count">+</button>
                    </>
                )}
            </div>

            {/* Bottom Text */}
            <div className={styles.bottomText}>
                {description || (
                    <>
                        <b>Silver Ticket - Top Position of the Auditorium, Full View</b><br />
                        {date}
                    </>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block w-full">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

export default DeepLiquidCard;
