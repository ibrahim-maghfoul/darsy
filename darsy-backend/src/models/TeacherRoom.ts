import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface ITeacherRoom extends Document {
    teacherId: mongoose.Types.ObjectId;
    teacherProfileId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    guidanceId: string;
    subjectId: string;
    inviteCode: string; // unique 8-char code
    inviteLink: string; // virtual
    members: mongoose.Types.ObjectId[];
    maxMembers: number;
    isActive: boolean;
    lastMessagePreview?: string;
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TeacherRoomSchema = new Schema<ITeacherRoom>({
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teacherProfileId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    guidanceId: { type: String, required: true },
    subjectId: { type: String, required: true },
    inviteCode: { type: String, required: true, unique: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    maxMembers: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    lastMessagePreview: { type: String },
    lastMessageAt: { type: Date },
}, {
    timestamps: true,
});

// Generate unique invite code before saving
TeacherRoomSchema.pre('save', function (next) {
    if (this.isNew && !this.inviteCode) {
        this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    next();
});

TeacherRoomSchema.index({ guidanceId: 1, subjectId: 1 });

export const TeacherRoom = mongoose.model<ITeacherRoom>('TeacherRoom', TeacherRoomSchema);
