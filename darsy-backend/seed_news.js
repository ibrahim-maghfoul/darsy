const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, required: true },
    date: { type: Date, default: Date.now },
    category: { type: String, required: true },
    author: { type: String },
    readTime: { type: String },
}, {
    timestamps: true,
});

const News = mongoose.model('News', NewsSchema);

const sampleNews = [
    {
        title: "New Math Course Launched",
        subtitle: "Advanced Algebra & Calculus",
        content: "We are excited to announce the launch of our new Advanced Algebra and Calculus course. This comprehensive program covers everything from differential equations to complex integration. Perfect for 2ème Bac students preparing for their finals.\n\n### What you will learn:\n- Linear Algebra basics\n- Advanced derivatives\n- Practical integration techniques\n- Real-world applications of Calculus\n\nJoin thousands of students who are already mastering Mathematics with DarsySchool.",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000",
        category: "Updates",
        author: "Prof. Ahmed",
        readTime: "5 min read",
        date: new Date()
    },
    {
        title: "Science Lab Virtual Tour",
        subtitle: "Physics Experiments Online",
        content: "Experience the magic of physics from the comfort of your home. Our new Virtual Lab allows students to conduct experiments in mechanics and electromagnetism using interactive 3D simulations. No lab coat required!\n\nThis initiative aims to make practical science accessible to everyone, regardless of their location. Our research shows that interactive simulations improve concept retention by up to 40%.",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000",
        category: "Events",
        author: "Dr. Sarah",
        readTime: "3 min read",
        date: new Date(Date.now() - 86400000)
    },
    {
        title: "Digital Learning Exhibition",
        subtitle: "The Future of Education",
        content: "DarsySchool will be presenting its latest AI-driven learning tools at the upcoming Digital Learning Exhibition in Casablanca. Come meet the team and discover how we are personalizing education for every student in Morocco.\n\nWe will be showcasing:\n- AI Path Discovery\n- Real-time Progress Tracking\n- Collaborative Study Rooms\n- Advanced Exam Predications",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000",
        category: "Exhibition",
        author: "Management",
        readTime: "4 min read",
        date: new Date(Date.now() - 172800000)
    }
];

async function seedNews() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        await News.deleteMany({});
        console.log('Cleared existing news');

        await News.insertMany(sampleNews);
        console.log('Successfully seeded news');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedNews();
