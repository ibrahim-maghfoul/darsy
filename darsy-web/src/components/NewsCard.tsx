'use client';

import { useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Zap, BookOpen, Megaphone, Users, Globe, Star, Heart, type LucideIcon,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useTranslations } from 'next-intl';
import styles from './NewsCard.module.css';

// ─── Constants (matches the reference design exactly) ─────────────────────────
const W = 340;
const H = 320;
const CR = 28;
const G = 8;
const SR = 18;
const IR = SR + G;   // 26 — concave inner corner
const BW = 43;       // badge circle diameter (1.2× original 36)
const BH = 43;       // badge height = diameter
const TbW = 110;      // read pill width
const TbH = 38;       // read pill height
const GAP = 10;       // image gap from notch/card edges
const PILL_PAD = 0;        // not needed for a circle
const TEXT_PUSH = 10;       // extra push right for both text rows

const TY = BH + G;           // top horizontal notch cut y
const BY = H - TbH - G;      // bottom horizontal notch cut y

const IMG_TOP = TY + GAP;
const IMG_BOTTOM = (H - BY) + GAP;
const IMG_LEFT = GAP;
const IMG_RIGHT = GAP;
const IMG_R = 10;

// Title sits in the badge band (top), pushed right of the circle
const TITLE_LEFT = BW + G + TEXT_PUSH;  // much smaller now → more title space
const TITLE_RIGHT = GAP;
const TITLE_H = BH;

// Meta sits in the read pill band (bottom), pushed left of the pill  
const META_LEFT = GAP + TEXT_PUSH;
const META_RIGHT = TbW + PILL_PAD + TEXT_PUSH;
const META_H = TbH;

// ─── SVG path builder ────────────────────────────────────────────────────────
function buildCardPath(): string {
    const tx = BW + G, ty = BH + G;
    const bx = W - TbW - G, by = H - TbH - G;
    return [
        `M ${tx + SR} 0`,
        `L ${W - CR} 0`, `A ${CR} ${CR} 0 0 1 ${W} ${CR}`,
        `L ${W} ${by - SR}`, `A ${SR} ${SR} 0 0 1 ${W - SR} ${by}`,
        `L ${bx + IR} ${by}`, `A ${IR} ${IR} 0 0 0 ${bx} ${by + IR}`,
        `L ${bx} ${H - SR}`, `A ${SR} ${SR} 0 0 1 ${bx - SR} ${H}`,
        `L ${CR} ${H}`, `A ${CR} ${CR} 0 0 1 0 ${H - CR}`,
        `L 0 ${ty + SR}`, `A ${SR} ${SR} 0 0 1 ${SR} ${ty}`,
        `L ${tx - IR} ${ty}`, `A ${IR} ${IR} 0 0 0 ${tx} ${ty - IR}`,
        `L ${tx} ${SR}`, `A ${SR} ${SR} 0 0 1 ${tx + SR} 0`,
        'Z',
    ].join(' ');
}

// ─── Arrow SVG ────────────────────────────────────────────────────────────────
const ArrowRight = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

// ─── Category → icon mapping ─────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, LucideIcon> = {
    'Product Update': Zap,
    'Educational': BookOpen,
    'Announcements': Megaphone,
    'Community': Users,
    'Technology': Globe,
    'Science': Star,
    'General': Star,
};

// ─── Component ────────────────────────────────────────────────────────────────
interface NewsCardProps {
    title?: string;
    category?: string;
    image?: string;
    date?: string;
    readTime?: string;
    href?: string;
    icon?: LucideIcon; // optional override icon
    children?: React.ReactNode;
    subtitle?: string; // alias for compat
    description?: React.ReactNode; // alias for compat
}

export default function NewsCard({
    title = 'Untitled Article',
    category = 'General',
    image = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
    date = '',
    readTime = '',
    href,
    icon,
    children,
}: NewsCardProps) {
    const t = useTranslations('News');
    const uid = useId().replace(/:/g, '');
    const path = buildCardPath();
    const gid = `nc-grad-${uid}`;
    const IconComponent = icon ?? (CATEGORY_ICONS[category] || Star);

    const { user, checkAuth } = useAuth();
    const { showSnackbar } = useSnackbar();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const articleId = href?.split('/').pop() || '';

    useEffect(() => {
        if (user?.progress?.savedNews && articleId) {
            setIsSaved(user.progress.savedNews.includes(articleId));
        }
    }, [user, articleId]);

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            showSnackbar('Please log in to save articles.', 'info');
            return;
        }
        if (isSaving || !articleId) return;

        setIsSaving(true);
        try {
            const res = await api.post('/user/saved-news', { newsId: articleId });
            const isSavedNow = res.data.savedNews.includes(articleId);
            setIsSaved(isSavedNow);
            showSnackbar(isSavedNow ? "Article saved to favorites" : "Article removed from favorites", "success");
            await checkAuth(); // update context
        } catch (error) {
            console.error('Failed to toggle save', error);
        } finally {
            setIsSaving(false);
        }
    };

    const pillBase: React.CSSProperties = {
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#3aaa6a',
        color: '#fff',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        gap: 6,
        padding: `0 ${PILL_PAD}px`,
        boxShadow: '0 2px 10px rgba(58,170,106,0.35)',
    };

    const card = (
        <div
            className={styles.cardWrapper}
            dir="ltr"
            style={{
                position: 'relative',
                width: W,
                height: H,
                cursor: 'pointer',
                flexShrink: 0,
                textAlign: 'left'
            }}
        >
            {/* Card shape — SVG background */}
            <svg
                width={W}
                height={H}
                viewBox={`0 0 ${W} ${H}`}
                className={styles.cardShape}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0.4" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#edf0f4" />
                    </linearGradient>
                    <clipPath id={`${gid}-clip`}>
                        <path d={path} />
                    </clipPath>
                </defs>
                <path d={path} fill={`url(#${gid})`} stroke="#17795E" strokeWidth="2" clipPath={`url(#${gid}-clip)`} />
                {/* Hover green pump layer (stays inside the path) */}
                <path d={path} fill="rgba(58, 170, 106, 0.15)" className={styles.svgHoverLayer} />
            </svg>

            {/* Clipped content layer */}
            <div style={{ position: 'absolute', inset: 0, clipPath: `path('${path}')` }}>
                {/* Title — vertically centered in badge band, pushed right of the pill */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: TITLE_LEFT, right: TITLE_RIGHT, height: TITLE_H,
                    display: 'flex', alignItems: 'center', overflow: 'hidden',
                }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {title}
                    </span>
                </div>

                {/* Image */}
                <div style={{
                    position: 'absolute',
                    top: IMG_TOP, left: IMG_LEFT, right: IMG_RIGHT, bottom: IMG_BOTTOM,
                    borderRadius: IMG_R,
                    backgroundColor: '#cdd5de',
                    overflow: 'hidden',
                }}>
                    <Image
                        src={image}
                        alt={title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 340px"
                    />
                </div>

                {/* Meta — vertically centered in read pill band, pushed left of the pill */}
                <div style={{
                    position: 'absolute',
                    bottom: 0, left: META_LEFT, right: META_RIGHT, height: META_H,
                    display: 'flex', alignItems: 'center', overflow: 'hidden',
                }}>
                    {children || (
                        <span style={{ fontSize: 11, color: '#8a97a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {date}{date && readTime ? ' · ' : ''}{readTime}
                        </span>
                    )}
                </div>
            </div>

            {/* Save Heart button — replaces category badge top-left */}
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(e); }}
                disabled={isSaving}
                title={isSaved ? "Unsave Article" : "Save Article"}
                style={{
                    ...pillBase,
                    top: 0, left: 0, width: BW, height: BH,
                    borderRadius: '50%', padding: 0,
                    border: 'none', cursor: href ? 'pointer' : 'default', zIndex: 10,
                    transition: 'transform 0.2s ease',
                    transform: isSaving ? 'scale(0.9)' : 'scale(1)'
                }}
            >
                <Heart size={22} strokeWidth={2.2} color="#fff" fill={isSaved ? "#fff" : "transparent"} className={isSaving ? "animate-pulse" : ""} />
            </button>

            {/* Hidden SVG goo filter — needed for blob merge effect */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                style={{ position: 'absolute', width: 0, height: 0 }}
                aria-hidden="true"
            >
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="gooResult" />
                        <feBlend in2="gooResult" in="SourceGraphic" result="mix" />
                    </filter>
                </defs>
            </svg>

            {/* Blob READ button — flush bottom-right */}
            <button className={styles.blobBtn}>
                <span className={styles.blobBtnInner}>
                    <span className={styles.blobBtnBlobs}>
                        <span className={styles.blobBtnBlob} />
                        <span className={styles.blobBtnBlob} />
                        <span className={styles.blobBtnBlob} />
                        <span className={styles.blobBtnBlob} />
                    </span>
                </span>
                <span className={styles.blobBtnLabel}>
                    {t('read')}
                    <ArrowRight />
                </span>
            </button>
        </div>
    );

    if (href) {
        return (
            <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>
                {card}
            </Link>
        );
    }

    return card;
}
