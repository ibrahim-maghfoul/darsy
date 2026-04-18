// ─── Darsy — Static Links & Contact Info ─────────────────────────────────────
// Single source of truth for all public URLs, social links, and contact details.
// Import from '@/lib/constants' wherever needed.

// ── Website Social Media ─────────────────────────────────────────────────────
export const SOCIALS = {
    twitter: 'https://twitter.com/darsyio',
    instagram: 'https://instagram.com/darsyio',
    facebook: 'https://facebook.com/darsyio',
    youtube: 'https://youtube.com/@darsyio',
    tiktok: '',       // add when ready
    linkedin: '',     // add when ready
    github: '',       // add when ready
} as const;

// ── Contact Info ─────────────────────────────────────────────────────────────
export const CONTACT = {
    email: 'hello@darsy.io',
    privacyEmail: 'privacy@darsy.io',
    phone: '+213 555 000 123',
    phoneTel: '+212642094671',
    location: 'Morocco',
} as const;

// ── Team Members ─────────────────────────────────────────────────────────────
// Each member has optional social links — leave empty string if not available.
export const TEAM = [
    {
        id: 1,
        name: 'Amira Benali',
        roleKey: 'member1_role',
        descKey: 'member1_desc',
        img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
        color: 'bg-[#9ef0b8]',
        rot: '-2.3deg',
        pattern: 'diagonal' as const,
        socials: { facebook: '', twitter: '', linkedin: '' },
    },
    {
        id: 2,
        name: 'Karim Mansour',
        roleKey: 'member2_role',
        descKey: 'member2_desc',
        img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        color: 'bg-[#52d4a0]',
        rot: '1.5deg',
        pattern: 'diagonal' as const,
        socials: { facebook: 'www.facebook.com/karim.mansour.12', twitter: '', linkedin: '' },
    },
    {
        id: 3,
        name: 'Sofia Cherkaoui',
        roleKey: 'member3_role',
        descKey: 'member3_desc',
        img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        color: 'bg-white',
        rot: '-1.0deg',
        pattern: 'coral' as const,
        socials: { facebook: '', twitter: '', linkedin: '' },
    },
    {
        id: 4,
        name: 'Yassine Driss',
        roleKey: 'member4_role',
        descKey: 'member4_desc',
        img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        color: 'bg-[#c8eeda]',
        rot: '2.9deg',
        pattern: 'diagonal' as const,
        socials: { facebook: '', twitter: '', linkedin: '' },
    },
    {
        id: 5,
        name: 'Nadia Ouhab',
        roleKey: 'member5_role',
        descKey: 'member5_desc',
        img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
        color: 'bg-[#4a7a5a]',
        rot: '-0.8deg',
        darkInfo: true,
        pattern: 'dots' as const,
        socials: { facebook: '', twitter: '', linkedin: '' },
    },
    {
        id: 6,
        name: 'Omar Taibi',
        roleKey: 'member6_role',
        descKey: 'member6_desc',
        img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        color: 'bg-[#d8ead2]',
        rot: '1.2deg',
        pattern: 'coral' as const,
        socials: { facebook: '', twitter: '', linkedin: '' },
    },
] as const;

// ── External Links ───────────────────────────────────────────────────────────
export const LINKS = {
    appStoreIos: '',      // add App Store link when ready
    appStoreAndroid: '',  // add Play Store link when ready
    appApk: '',           // add direct APK download link
} as const;
