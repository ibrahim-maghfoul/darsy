import { Server, Socket } from 'socket.io';
import Message from '../models/Message';
import ChatRoom from '../models/ChatRoom';

// In-memory active user tracker: room -> Map of { userId -> details }
const roomUsers = new Map<string, Map<string, { userId: string, displayName: string, photoURL?: string, subscriptionPlan?: string }>>();

// Mapping socket IDs to user context specifically for disconnect handling
const socketContexts = new Map<string, { room: string, userId: string }>();

export const handleChatConnection = (io: Server, socket: Socket) => {
    // Join a specific room based on guidance and level
    socket.on('join_room', async (data: { guidance: string; level: string; userId: string; displayName: string; photoURL?: string; subscriptionPlan?: string }) => {
        const roomKey = `${data.guidance}_${data.level}`;
        socket.join(roomKey);

        // Find or create the ChatRoom metadata document
        let chatRoom = await ChatRoom.findOne({ roomKey });
        if (!chatRoom) {
            chatRoom = await ChatRoom.create({
                guidance: data.guidance,
                level: data.level,
                roomKey,
                participants: [data.userId]
            });
        } else if (!chatRoom.participants.includes(data.userId as any)) {
            chatRoom.participants.push(data.userId as any);
            await chatRoom.save();
        }

        // Fetch full participant list with details
        const populatedRoom = await ChatRoom.findOne({ roomKey })
            .populate('participants', 'displayName photoURL subscription.plan');

        if (populatedRoom) {
            io.to(roomKey).emit('room_participants', populatedRoom.participants);
        }

        // Track the user in memory for active status
        if (!roomUsers.has(roomKey)) {
            roomUsers.set(roomKey, new Map());
        }
        roomUsers.get(roomKey)!.set(data.userId, {
            userId: data.userId,
            displayName: data.displayName,
            photoURL: data.photoURL,
            subscriptionPlan: data.subscriptionPlan
        });

        socketContexts.set(socket.id, { room: roomKey, userId: data.userId });

        console.log(`User ${socket.id} (${data.displayName}) joined room ${roomKey}`);

        // Broadcast the active users in the room
        io.to(roomKey).emit('room_users', Array.from(roomUsers.get(roomKey)!.values()));
    });

    // Send a message
    socket.on('send_message', async (data: { guidance: string; level: string; sender: string; text: string; replyTo?: string }) => {
        const roomKey = `${data.guidance}_${data.level}`;

        try {
            // Find the ChatRoom ID
            const chatRoom = await ChatRoom.findOne({ roomKey });
            if (!chatRoom) return;

            // Save to DB
            const newMessage = new Message({
                chatRoomId: chatRoom._id,
                sender: data.sender,
                text: data.text,
                reactions: [],
                replyTo: data.replyTo || undefined
            });
            await newMessage.save();

            // Update room metadata
            chatRoom.lastMessagePreview = data.text;
            chatRoom.lastMessageAt = new Date();
            await chatRoom.save();

            // Populate sender details before emitting
            const populatedMessage = await Message.findById(newMessage._id)
                .populate('sender', 'displayName photoURL subscription.plan')
                .populate({
                    path: 'replyTo',
                    select: 'text sender',
                    populate: { path: 'sender', select: '_id displayName subscription.plan' }
                });

            // Broadcast to room
            io.to(roomKey).emit('receive_message', populatedMessage);
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Add or remove a reaction
    socket.on('reaction', async (data: { messageId: string; emoji: string; userId: string; guidance: string; level: string }) => {
        const roomKey = `${data.guidance}_${data.level}`;

        try {
            const message = await Message.findById(data.messageId);
            if (!message) return;

            // Check if user already reacted with THIS emoji
            const existingReactionIndex = message.reactions.findIndex(
                (r: any) => r.userId.toString() === data.userId && r.emoji === data.emoji
            );

            if (existingReactionIndex > -1) {
                // Toggle off (remove)
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Add reaction
                message.reactions.push({ emoji: data.emoji, userId: data.userId as any });
            }

            await message.save();

            // Broadcast updated message
            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'displayName photoURL subscription.plan')
                .populate({
                    path: 'replyTo',
                    select: 'text sender',
                    populate: { path: 'sender', select: '_id displayName subscription.plan' }
                });
            io.to(roomKey).emit('message_updated', populatedMessage);

        } catch (error) {
            console.error('Error updating reaction:', error);
        }
    });

    // Typing indicators
    socket.on('typing_start', (data: { guidance: string; level: string; userId: string; displayName: string }) => {
        const roomKey = `${data.guidance}_${data.level}`;
        socket.to(roomKey).emit('user_typing', { userId: data.userId, displayName: data.displayName });
    });

    socket.on('typing_end', (data: { guidance: string; level: string; userId: string }) => {
        const roomKey = `${data.guidance}_${data.level}`;
        socket.to(roomKey).emit('user_stopped_typing', { userId: data.userId });
    });

    socket.on('disconnect', () => {
        const context = socketContexts.get(socket.id);
        if (context) {
            const { room, userId } = context;
            const usersInRoom = roomUsers.get(room);

            if (usersInRoom) {
                usersInRoom.delete(userId);
                // If the room is empty, we can clean up the map entirely
                if (usersInRoom.size === 0) {
                    roomUsers.delete(room);
                } else {
                    // Tell everyone else the user left
                    io.to(room).emit('room_users', Array.from(roomUsers.get(room)!.values()));
                }
            }
            socketContexts.delete(socket.id);
        }
        console.log(`User ${socket.id} disconnected`);
    });
};
