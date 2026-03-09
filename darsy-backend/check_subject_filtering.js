const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const Subject = mongoose.model('Subject', new mongoose.Schema({
            _id: String,
            title: String,
            guidanceId: String
        }, { collection: 'subjects', _id: false }));

        const Guidance = mongoose.model('Guidance', new mongoose.Schema({
            _id: String,
            title: String
        }, { collection: 'guidances', _id: false }));

        const subjects = await Subject.find().limit(10);
        console.log(`Found ${subjects.length} sample subjects:`);

        for (const sub of subjects) {
            const guidance = await Guidance.findOne({ _id: sub.guidanceId });
            console.log(`- Subject: "${sub.title}", _id: "${sub._id}", guidanceId: "${sub.guidanceId}" -> Found Guidance: ${guidance ? `"${guidance.title}"` : 'NOT FOUND'}`);
        }

        const allGuidances = await Guidance.find();
        console.log(`\nTotal Guidances in DB: ${allGuidances.length}`);

        const allSubjects = await Subject.find();
        console.log(`Total Subjects in DB: ${allSubjects.length}`);

        // Check if any subject has guidanceId "all"
        const allSubjectsWithAll = await Subject.find({ guidanceId: 'all' });
        console.log(`Subjects with guidanceId 'all': ${allSubjectsWithAll.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
