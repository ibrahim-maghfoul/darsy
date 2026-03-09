import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document<string> {
    _id: string;
    // Core fields
    title: string;
    description: string;
    content?: string;
    imageUrl: string;
    date: Date;
    category: string;
    author?: string;
    readTime?: string;
    links?: { label: string; url: string }[];

    // Scraped data fields
    type?: string;
    card_date?: string;
    url?: string;
    paragraphs?: string[];
    images?: { src: string; alt?: string }[];
    content_blocks?: mongoose.Schema.Types.Mixed[];
    attachments?: { label: string; url: string; format?: string }[];

    viewCount: number;
    rating: {
        average: number;
        count: number;
        total: number;
    };
    userRatings?: { userId: string; rating: number }[];

    createdAt: Date;
    updatedAt: Date;
}

const NewsSchema = new Schema<INews>({
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    content: { type: String },
    imageUrl: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    category: { type: String, default: 'General' },
    author: { type: String },
    readTime: { type: String },
    links: [{ label: String, url: String }],

    // Scraped fields
    type: { type: String },
    card_date: { type: String },
    url: { type: String },
    paragraphs: [{ type: String }],
    images: [{ src: String, alt: String }],
    content_blocks: [{ type: Schema.Types.Mixed }],
    attachments: [{ label: String, url: String, format: String }],

    viewCount: { type: Number, default: 0 },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
    },
    userRatings: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true }
    }],
}, {
    timestamps: true,
});

// Text index for search
NewsSchema.index({ title: 'text', description: 'text' });

export const News = mongoose.model<INews>('News', NewsSchema);
