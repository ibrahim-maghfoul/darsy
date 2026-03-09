import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
    userId: string;
    type: 'bug' | 'suggestion' | 'feedback';
    title: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: Date;
    updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['bug', 'suggestion', 'feedback'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
}, {
    timestamps: true
});

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
