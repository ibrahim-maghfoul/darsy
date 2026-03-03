"use client";

import { Hero } from "@/components/home/Hero";
import NewsPreview from "@/components/home/NewsPreview";
import Testimonials from "@/components/home/Testimonials";

export default function Home() {
    return (
        <main className="flex flex-col gap-8 pb-8">
            <Hero />
            <NewsPreview />
            <Testimonials />
        </main>
    );
}
