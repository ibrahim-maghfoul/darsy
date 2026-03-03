"use client";

import { HeroSection } from "@/components/HeroSection";
import { BelieveSection } from "@/components/BelieveSection";
import { CoursesSection } from "@/components/CoursesSection";
import { ChatFeatureSection } from "@/components/ChatFeatureSection";
import { WorksSection } from "@/components/WorksSection";
import { TeamSection } from "@/components/TeamSection";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const t = useTranslations('Trusted');
  const commonT = useTranslations('Common');
  const coursesRef = useRef<HTMLDivElement>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show button even if only a tiny bit of the section is visible
        if (entry.isIntersecting) {
          setShowButton(true);
        } else if (entry.boundingClientRect.top > 0) {
          // Hide button only if we are ABOVE the section
          setShowButton(false);
        }
      },
      { threshold: 0.01 }
    );

    if (coursesRef.current) {
      observer.observe(coursesRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen font-roboto bg-white selection:bg-green/10 selection:text-green"
    >
      <div className="absolute top-0 left-0 w-full h-[120vh] bg-gradient-to-b from-green/[0.03] to-transparent pointer-events-none" />

      <main className="flex flex-col pt-[72px]">
        <HeroSection />

        {/* Trusted Strip */}
        <div className="bg-transparent p-[16px_0_28px] relative z-5 border-t border-green/10">
          <div className="text-center text-[10.5px] font-semibold tracking-[0.12em] uppercase text-[#8aab98] mb-4">
            {t('text')}
          </div>
          <div className="flex items-center justify-center gap-[clamp(32px,8vw,100px)]">
            <div className="opacity-[0.38] hover:opacity-[0.85] transition-opacity cursor-default flex items-center">
              <svg height="22" viewBox="0 0 67 28" className="fill-dark">
                <path d="M5.6 10.2c0-1 .8-1.4 2.2-1.4 2 0 4.5.6 6.5 1.7V4.2C12 3.1 9.9 2.7 7.8 2.7 3.2 2.7.2 5.1.2 10c0 7.7 10.6 6.4 10.6 9.7 0 1.2-1 1.5-2.4 1.5-2.1 0-4.8-.9-7-2.2v6.3c2.4 1 4.8 1.5 7 1.5 5.3 0 9-2.3 9-7.3-.1-8.3-10.8-6.8-11.8-9.3zM27.8 3.6l-5.5 1.2-.2 16.3 5.7.1V3.6zm7.5 17.3l5.5-16.4H47l-8.5 22.5H32l-8.5-22.5h6.3l5.5 16.4zm12.4-10.4h11.5C59 7.4 56.9 5.8 54.3 5.8c-2.8 0-5.2 2-6.3 4.7h-.3zm12 7.4c-1.2 1.4-3 2.2-5.2 2.2-3 0-5.5-1.7-6.4-4.2H67c.1-.6.1-1.2.1-1.8C67.1 8 62.7 3.5 57 3.5c-6.3 0-10.5 4.5-10.5 10.7 0 6.3 4.2 10.7 10.8 10.7 3.8 0 6.7-1.4 8.7-3.9l-4.3-2.1z" />
              </svg>
            </div>
            {/* ... other SVGs ... */}
            <div className="opacity-[0.38] hover:opacity-[0.85] transition-opacity cursor-default flex items-center">
              <svg height="26" viewBox="0 0 100 100" className="fill-dark">
                <path d="M6.3 6.3l55.6-4.1c6.8-.6 8.6-.2 12.9 2.9l17.8 12.5c2.9 2.1 3.9 2.7 3.9 5.1v68c0 4.4-1.6 7-7.2 7.4l-64.3 3.9c-4.2.2-6.2-.4-8.4-3.1L4.3 83.2c-2.4-3-3.4-5.2-3.4-7.8V13.3c0-3.6 1.6-6.5 5.4-7zm51.4 5.6L29.9 14c-1.3.1-1.7.8-1.7 2.1v54.4c0 1.4.4 2.1 1.7 2.1 1.2 0 1.6-.4 2.7-1.7l27.2-43.2v39.8l-7.7 1.8c-1.3.3-1.6.9-1.4 2l2.2 7.2c.3 1.3 1 1.7 2.4 1.3l20-5.6c1.3-.4 1.6-1.1 1.3-2.2l-1.8-7c-.3-1.1-1.1-1.5-2.2-1.2L70.4 65V23.4c0-1.4-.7-2.1-1.9-2l-10.8.5z" />
              </svg>
            </div>
            <div className="opacity-[0.38] hover:opacity-[0.85] transition-opacity cursor-default flex items-center">
              <svg height="24" viewBox="0 0 100 100" className="fill-dark">
                <path d="M1.9 61.5L38.5 98C17.9 93.5 1.5 77.1 1.9 61.5zM0 47.5L52.5 100c2-.2 4-.5 5.9-.9L.9 41.6C.3 43.5 0 45.5 0 47.5zm8.3-21.1l65.2 65.2c2-.8 3.9-1.7 5.7-2.8L11.1 19.9c-1 1.7-2 3.5-2.8 5.5zm14.1-15L93.6 82.6C95 81 96.3 79.3 97.5 77.5L27.6 7.6C25.7 8.7 24 10 22.4 11.4zm18.7-9.1L97.7 60.9C99.1 57 100 52.8 100 48.5l-1.2-1.2C97.8 21.5 78.3 2 52.6.3L41.1 2.3z" />
              </svg>
            </div>
          </div>
        </div>

        <BelieveSection />
        <ChatFeatureSection />
        <div ref={coursesRef}>
          <CoursesSection />
        </div>
        <WorksSection />
        <TeamSection />

        <AnimatePresence>
          {showButton && (
            <Link href="/explore">
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="fixed bottom-8 right-8 bg-dark text-white font-semibold text-sm p-[14px_26px] rounded-full shadow-[0_6px_28px_rgba(0,0,0,0.28)] z-[100] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_36px_rgba(0,0,0,0.35)]"
              >
                {commonT('start_learning')} →
              </motion.button>
            </Link>
          )}
        </AnimatePresence>
      </main>

      {/* Footer newsletter spacing */}
    </motion.div>
  );
}
