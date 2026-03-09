// ── Server Component — fetches from MongoDB via the backend API ──────────────

import { Tag } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import NewsGrid from '@/components/NewsGrid';
import NewsletterCTA from '@/components/NewsletterCTA';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60';

async function getNewsItems() {
    try {
        const res = await fetch(`${BACKEND}/api/news?limit=500`, {
            next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        const articles = Array.isArray(data) ? data : (data.news || []);

        return articles.map((art: any) => {
            const imageFromBlocks = art.content_blocks?.find((b: any) => b.type === 'image')?.src;
            const image =
                art.imageUrl && !art.imageUrl.includes('unsplash') ? art.imageUrl
                    : art.images?.[0]?.src
                    || imageFromBlocks
                    || FALLBACK_IMAGE;
            return {
                id: art._id?.toString(),
                title: art.title || 'Untitled',
                subtitle: art.type || art.category || '',
                category: art.category || 'General',
                date: art.card_date || (art.createdAt ? new Date(art.createdAt).toLocaleDateString() : ''),
                readTime: art.readTime || '',
                image,
            };
        });
    } catch (e) {
        console.warn('[NewsPage] Failed to fetch from API, returning empty list:', e);
        return [];
    }
}

export default async function NewsPage() {
    const [t, ft, newsItems] = await Promise.all([
        getTranslations('News'),
        getTranslations('Footer'),
        getNewsItems(),
    ]);

    return (
        <div className="min-h-screen pt-32 pb-32 px-[clamp(16px,5vw,48px)]">
            <div className="max-w-7xl mx-auto space-y-14">

                {/* Page Header */}
                <div className="text-center space-y-5">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold">
                        <Tag size={16} />
                        Darsy {t('title')}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-dark leading-tight">
                        {t('title')}
                    </h1>
                </div>

                {/* Interactive paginated grid */}
                {newsItems.length === 0 ? (
                    <div className="text-center py-20 text-dark/40">
                        <p className="text-xl font-bold">No articles found</p>
                        <p className="text-sm mt-2">Upload scraped data from the admin panel to get started.</p>
                    </div>
                ) : (
                    <NewsGrid items={newsItems} />
                )}

                {/* Newsletter CTA */}
                <NewsletterCTA ft={{
                    loop: ft('loop'),
                    loop_desc: ft('loop_desc'),
                    subscribe_placeholder: ft('subscribe_placeholder'),
                    newsletter: ft('newsletter')
                }} />

            </div>
        </div>
    );
}
