const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function matchTest() {
    try {
        await mongoose.connect(MONGODB_URI);

        const Subject = mongoose.model('Subject', new mongoose.Schema({
            _id: String,
            title: String,
            guidanceId: String
        }, { collection: 'subjects', _id: false }));

        const Guidance = mongoose.model('Guidance', new mongoose.Schema({
            _id: String,
            title: String
        }, { collection: 'guidances', _id: false }));

        const subjects = await Subject.find().limit(50);
        console.log(`Checking ${subjects.length} sample subjects...`);

        const guidanceIdsInSubjects = [...new Set(subjects.map(s => s.guidanceId))];
        console.log(`Unique guidanceIds in those subjects: ${guidanceIdsInSubjects.length}`);

        for (const gid of guidanceIdsInSubjects) {
            const found = await Guidance.findOne({ _id: gid });
            console.log(`- guidanceId "${gid}": ${found ? `MATCH FOUND ("${found.title}")` : 'NO MATCH'}`);
        }

        const guidances = await Guidance.find().limit(10);
        console.log(`\nSample Guidance IDs from DB:`);
        guidances.forEach(g => console.log(`- ${g.title}: ${g._id}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

matchTest();
