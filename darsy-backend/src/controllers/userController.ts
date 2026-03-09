import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { News } from '../models/News';
import { Feedback } from '../models/Feedback';
import { config } from '../config';
import { hashPassword, comparePassword } from '../utils/auth';
import path from 'path';
import fs from 'fs/promises';

export class UserController {
    // Get user profile
    static async getProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = await User.findById(req.userId);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isPremium: user.isPremium,
                level: user.level,
                subscription: user.subscription,
                progress: user.progress,
                settings: user.settings,
                selectedPath: user.selectedPath,
                phone: user.phone,
                nickname: user.nickname,
                city: user.city,
                age: user.age,
                gender: user.gender,
                schoolName: user.schoolName,
                studyLocation: user.studyLocation,
                role: user.role,
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }

    // Update user profile
    static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const updates = req.body;
            const allowedUpdates = [
                'displayName',
                'phone',
                'nickname',
                'city',
                'age',
                'gender',
                'schoolName',
                'studyLocation',
                'settings',
                'level',
                'selectedPath'
            ];

            const filteredUpdates: any = {};
            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    const value = updates[key];
                    // Don't update with empty string for fields that have specific types or constraints
                    if (value === "" && (key === 'age' || key === 'gender')) {
                        return;
                    }
                    filteredUpdates[key] = value;
                }
            });

            // Convert age to number if present
            if (filteredUpdates.age !== undefined) {
                filteredUpdates.age = parseInt(filteredUpdates.age);
            }

            // Phone validation
            if (filteredUpdates.phone) {
                const phoneRegex = /^\+?[0-9]{10,15}$/;
                if (!phoneRegex.test(filteredUpdates.phone)) {
                    res.status(400).json({ error: 'Invalid phone number format' });
                    return;
                }
            }

            const user = await User.findByIdAndUpdate(
                req.userId,
                { $set: filteredUpdates },
                { new: true, runValidators: true }
            );

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isPremium: user.isPremium,
                level: user.level,
                subscription: user.subscription,
                progress: user.progress,
                settings: user.settings,
                selectedPath: user.selectedPath,
                phone: user.phone,
                nickname: user.nickname,
                city: user.city,
                age: user.age,
                gender: user.gender,
                schoolName: user.schoolName,
                studyLocation: user.studyLocation,
                role: user.role,
            });
        } catch (error: any) {
            console.error('Update profile error:', error);
            if (error.name === 'ValidationError') {
                res.status(400).json({ error: error.message });
                return;
            }
            if (error.code === 11000) {
                res.status(400).json({ error: 'Email already in use' });
                return;
            }
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    // Change password
    static async changePassword(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                res.status(400).json({ error: 'Current and new passwords are required' });
                return;
            }

            if (newPassword.length < 6) {
                res.status(400).json({ error: 'New password must be at least 6 characters long' });
                return;
            }

            const user = await User.findById(req.userId).select('+password');
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const isMatch = await comparePassword(currentPassword, user.password);
            if (!isMatch) {
                res.status(400).json({ error: 'Incorrect current password' });
                return;
            }

            user.password = await hashPassword(newPassword);
            await user.save();

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }

    // Upload profile picture
    static async uploadProfilePicture(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            // Save ONLY the filename
            const photoURL = req.file.filename;

            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Delete old profile photo if exists and is different from the new one
            if (user.photoURL) {
                try {
                    let oldPhotoPath = '';

                    if (user.photoURL.includes('/')) {
                        // Legacy: contains path
                        const urlWithoutParams = user.photoURL.split('?')[0];
                        const oldFilename = urlWithoutParams.split('/').pop();
                        if (oldFilename && oldFilename !== req.file.filename) {
                            const relativePath = urlWithoutParams.startsWith('/') ? urlWithoutParams.substring(1) : urlWithoutParams;
                            oldPhotoPath = path.join(process.cwd(), relativePath);
                        }
                    } else if (user.photoURL !== req.file.filename) {
                        // New: filename only
                        oldPhotoPath = path.join(process.cwd(), 'data/images/profile-picture', user.photoURL);
                    }

                    if (oldPhotoPath) {
                        await fs.access(oldPhotoPath);
                        await fs.unlink(oldPhotoPath);
                    }
                } catch (err) {
                    // Ignore errors during deletion
                }
            }

            user.photoURL = photoURL;
            await user.save();

            res.json({ photoURL });
        } catch (error) {
            console.error('Upload photo error:', error);
            res.status(500).json({ error: 'Failed to upload photo' });
        }
    }

    // Delete account
    static async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Delete profile photo if exists
            if (user.photoURL) {
                const relativePath = user.photoURL.replace(config.backendUrl, '');
                const photoPath = path.join(process.cwd(), relativePath);
                try {
                    await fs.unlink(photoPath);
                } catch (err) {
                    console.error('Failed to delete photo during account deletion:', err);
                }
            }

            await User.findByIdAndDelete(req.userId);
            res.json({ message: 'Account deleted successfully' });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({ error: 'Failed to delete account' });
        }
    }

    // Create report
    static async createReport(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { type, title, description } = req.body;
            const feedback = new Feedback({
                userId: req.userId,
                type,
                title,
                description
            });
            await feedback.save();
            res.status(201).json(feedback);
        } catch (error) {
            console.error('Create report error:', error);
            res.status(500).json({ error: 'Failed to create report' });
        }
    }

    // Get hydrated saved news items
    static async getSavedNews(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const savedIds = user.progress.savedNews || [];
            if (savedIds.length === 0) {
                res.json([]);
                return;
            }

            const activeNews = await News.find({ _id: { $in: savedIds } }, {
                title: 1, category: 1, type: 1, imageUrl: 1, images: 1, date: 1, card_date: 1, readTime: 1
            }).lean();

            // Sort by original save order (newest first)
            const sortedNews = activeNews.sort((a, b) => {
                return savedIds.indexOf(b._id.toString()) - savedIds.indexOf(a._id.toString());
            });

            res.json(sortedNews);
        } catch (error) {
            console.error('Get saved news error:', error);
            res.status(500).json({ error: 'Failed to get saved news' });
        }
    }

    // Toggle saved news
    static async toggleSavedNews(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { newsId } = req.body;
            if (!newsId) {
                res.status(400).json({ error: 'newsId is required' });
                return;
            }

            const user = await User.findById(req.userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const savedNews = user.progress.savedNews || [];
            const index = savedNews.indexOf(newsId);
            let action = '';

            if (index === -1) {
                // Not saved, add it
                savedNews.push(newsId);
                action = 'saved';
            } else {
                // Already saved, remove it
                savedNews.splice(index, 1);
                action = 'unsaved';
            }

            user.progress.savedNews = savedNews;
            await user.save();

            res.json({ message: `Article ${action} successfully`, savedNews });
        } catch (error) {
            console.error('Toggle saved news error:', error);
            res.status(500).json({ error: 'Failed to toggle saved news' });
        }
    }

    // Create simulation for subscription
    static async subscribe(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { plan, billingCycle } = req.body;
            if (!['free', 'premium', 'pro'].includes(plan)) {
                res.status(400).json({ error: 'Invalid plan' });
                return;
            }

            const expiresAt = billingCycle === 'monthly'
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                : billingCycle === 'yearly'
                    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    : undefined;

            const user = await User.findByIdAndUpdate(
                req.userId,
                {
                    subscription: {
                        plan,
                        billingCycle: plan === 'free' ? 'none' : billingCycle,
                        expiresAt: plan === 'free' ? undefined : expiresAt
                    }
                },
                { new: true }
            );

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({
                message: 'Subscribed successfully',
                subscription: user.subscription
            });
        } catch (error) {
            console.error('Subscribe error:', error);
            res.status(500).json({ error: 'Failed to subscribe' });
        }
    }
}
