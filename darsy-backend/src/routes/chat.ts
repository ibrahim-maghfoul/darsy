import express from 'express';
import { authMiddleware } from '../middleware/auth';
import Message from '../models/Message';

import ChatRoom from '../models/ChatRoom';
import { UserReport } from '../models/UserReport';

const router = express.Router();

// Get chat history for a specific room (resolved by guidance + level)
router.get('/history', authMiddleware, async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { guidance, level } = req.query;

        if (!guidance || !level) {
            res.status(400).json({ error: 'Guidance and level are required' });
            return;
        }

        const roomKey = `${guidance}_${level}`;

        // Find or create the ChatRoom metadata document
        let chatRoom = await ChatRoom.findOne({ roomKey });
        if (!chatRoom) {
            chatRoom = await ChatRoom.create({
                guidance,
                level,
                roomKey: roomKey,
                participants: []
            });
        }

        const messages = await Message.find({ chatRoomId: chatRoom._id })
            .sort({ createdAt: -1 }) // Get newest first
            .limit(50)
            .populate('sender', 'displayName photoURL subscription.plan')
            .populate({
                path: 'replyTo',
                select: 'text sender',
                populate: { path: 'sender', select: '_id displayName subscription.plan' }
            });

        // Reverse to send oldest first (chronological order for the UI)
        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Server error fetching chat history' });
    }
});

// Report a user/message in chat
router.post('/report', authMiddleware, async (req: any, res: express.Response): Promise<void> => {
    try {
        const { reportedUserId, messageId, reason, details } = req.body;
        const reporterId = req.user.id;

        if (!reportedUserId || !reason || !details) {
            res.status(400).json({ error: 'Reported user, reason, and details are required' });
            return;
        }

        const report = await UserReport.create({
            reporterId,
            reportedUserId,
            messageId,
            reason,
            details,
            status: 'pending'
        });

        res.status(201).json({ message: 'Report submitted successfully', reportId: report._id });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Server error submitting report' });
    }
});

export default router;
