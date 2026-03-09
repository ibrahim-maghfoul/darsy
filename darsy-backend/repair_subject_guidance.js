const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function repairData() {
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

        const subjects = await Subject.find();
        const guidances = await Guidance.find();

        console.log(`Checking ${subjects.length} subjects against ${guidances.length} guidances...`);

        let fixedCount = 0;
        let skippedCount = 0;

        for (const sub of subjects) {
            // Check if current guidanceId exists
            const currentGuidance = await Guidance.findOne({ _id: sub.guidanceId });

            if (currentGuidance) {
                // Already correctly linked
                skippedCount++;
                continue;
            }

            // Current guidanceId is orphaned. Try to find match by title.
            // We'll look for a guidance whose title matches the subject's title or contains useful info
            // Since subjects often have titles like "Maths", "Physics", etc.
            // and Guidances have similar names "Sciences Mathématiques", "Sciences Physiques".

            // This is a heuristic. We'll try to find a guidance where the subject title is related.
            // Actually, better to check if we can find any guidance whose title is a substring or vice versa
            const match = guidances.find(g =>
                g.title.toLowerCase().includes(sub.title.toLowerCase()) ||
                sub.title.toLowerCase().includes(g.title.toLowerCase())
            );

            if (match) {
                await Subject.updateOne({ _id: sub._id }, { $set: { guidanceId: match._id } });
                console.log(`Fixed: Subject "${sub.title}" -> Guidances "${match.title}" (${match._id})`);
                fixedCount++;
            } else {
                console.log(`Could not find match for Subject: "${sub.title}" (Original GID: ${sub.guidanceId})`);
                // Optional: assign to a 'general' guidance if one exists?
            }
        }

        console.log(`\nRepair Complete:`);
        console.log(`- Fixed: ${fixedCount}`);
        console.log(`- Valid: ${skippedCount}`);
        console.log(`- Unresolved: ${subjects.length - fixedCount - skippedCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

repairData();
