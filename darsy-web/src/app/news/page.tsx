// ── Server Component — fetches from MongoDB via the backend API ──────────────

import { Tag } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import NewsGrid from '@/components/NewsGrid';

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
                <div className="bg-green p-12 md:p-20 rounded-[48px] text-center space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-dark rounded-full blur-[120px]" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h2 className="text-4xl font-bold text-white">{ft('loop')}</h2>
                        <p className="text-white/80 text-lg max-w-xl mx-auto">{ft('loop_desc')}</p>
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                        <input
                            type="email"
                            placeholder={ft('subscribe_placeholder')}
                            className="flex-1 px-8 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:bg-white focus:text-dark transition-all"
                        />
                        <button className="px-10 py-4 rounded-2xl bg-white text-green font-bold hover:scale-105 transition-all shadow-xl">
                            {ft('newsletter')}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
