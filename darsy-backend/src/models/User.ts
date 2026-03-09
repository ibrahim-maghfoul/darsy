import mongoose, { Schema, Document } from 'mongoose';



export interface IUser extends Document {
    displayName: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    photoURL?: string;
    subscription: {
        plan: 'free' | 'premium' | 'pro';
        billingCycle: 'monthly' | 'yearly' | 'none';
        expiresAt?: Date;
    };
    level?: {
        school: string;
        level: string;
        guidance: string;
    };
    phone?: string;
    nickname?: string;
    city?: string;
    age?: number;
    gender?: 'male' | 'female';
    schoolName?: string;
    studyLocation?: string;
    progress: {
        totalLessons: number;
        completedLessons: number;
        learningTime: number; // in minutes
        documentsOpened: number;
        videosWatched: number;
        usageTime: number;
        savedNews: string[];
        lessons: {
            lessonId: string;
            subjectId: string;
            isFavorite: boolean;
            lastAccessed: Date;
            totalTimeSpent: number;
            completedResources: string[];
            totalResourcesCount: number;
        }[];
    };
    settings: {
        notifications: boolean;
        theme: 'light' | 'dark' | 'system';
    };
    selectedPath?: {
        schoolId: string;
        levelId: string;
        guidanceId: string;
    };
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
    isPremium: boolean; // virtual
}

const UserSchema = new Schema<IUser>({
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    photoURL: { type: String },
    subscription: {
        plan: { type: String, enum: ['free', 'premium', 'pro'], default: 'free' },
        billingCycle: { type: String, enum: ['monthly', 'yearly', 'none'], default: 'none' },
        expiresAt: { type: Date },
    },
    level: {
        school: String,
        level: String,
        guidance: String,
    },
    phone: String,
    nickname: String,
    city: String,
    age: { type: Number, max: 80 },
    gender: { type: String, enum: ['male', 'female'] },
    schoolName: String,
    studyLocation: String,
    progress: {
        totalLessons: { type: Number, default: 0 },
        completedLessons: { type: Number, default: 0 },
        learningTime: { type: Number, default: 0 },
        documentsOpened: { type: Number, default: 0 },
        videosWatched: { type: Number, default: 0 },
        usageTime: { type: Number, default: 0 },
        savedNews: { type: [String], default: [] },
        lessons: [{
            lessonId: { type: String, required: true },
            subjectId: { type: String, required: true },
            isFavorite: { type: Boolean, default: false },
            lastAccessed: { type: Date, default: Date.now },
            totalTimeSpent: { type: Number, default: 0 },
            completedResources: { type: [String], default: [] },
            totalResourcesCount: { type: Number, default: 0 },
        }],
    },
    settings: {
        notifications: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    selectedPath: {
        schoolId: String,
        levelId: String,
        guidanceId: String,
    },
    refreshToken: { type: String, select: false },
}, {
    timestamps: true,
});

// Indexes for better query performance
UserSchema.index({ 'progress.lessons.lessonId': 1 });
UserSchema.index({ 'progress.lessons.subjectId': 1 });

// Virtual: isPremium is true when plan is 'premium' or 'pro'
UserSchema.virtual('isPremium').get(function (this: IUser) {
    return this.subscription?.plan === 'premium' || this.subscription?.plan === 'pro';
});

export const User = mongoose.model<IUser>('User', UserSchema);
