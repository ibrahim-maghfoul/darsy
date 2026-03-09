const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function finalMatchTest() {
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

        const subjects = await Subject.find().limit(5);
        console.log(`Checking first 5 subjects...`);

        for (const sub of subjects) {
            console.log(`\nSubject: "${sub.title}"`);
            console.log(`  guidanceId: "${sub.guidanceId}" (length: ${sub.guidanceId?.length})`);

            const match = await Guidance.findOne({ _id: sub.guidanceId });
            console.log(`  Direct Match Found: ${match ? `YES ("${match.title}")` : 'NO'}`);

            if (!match) {
                // Check all guidances to see if any ID starts with or contains the GID
                const allG = await Guidance.find();
                const partial = allG.find(g => g._id.includes(sub.guidanceId) || sub.guidanceId.includes(g._id));
                console.log(`  Partial Match Found: ${partial ? `YES ("${partial.title}" _id: "${partial._id}")` : 'NO'}`);

                // Try title match
                const titleMatch = allG.find(g => g.title.toLowerCase().includes(sub.title.toLowerCase()));
                console.log(`  Title Match Found: ${titleMatch ? `YES ("${titleMatch.title}" _id: "${titleMatch._id}")` : 'NO'}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

finalMatchTest();
