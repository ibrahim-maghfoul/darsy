const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function analyzeData() {
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

        const guidances = await Guidance.find();
        console.log(`Found ${guidances.length} Guidances.\n`);

        for (const g of guidances) {
            const count = await Subject.countDocuments({ guidanceId: g._id });
            console.log(`Guidance: "${g.title}" (_id: ${g._id}) -> Subjects Count: ${count}`);

            if (count > 0) {
                const sample = await Subject.find({ guidanceId: g._id }).limit(3);
                console.log(`   Samples: ${sample.map(s => s.title).join(', ')}`);
            }
        }

        const orphanCount = await Subject.countDocuments({ guidanceId: { $exists: false } });
        const emptyCount = await Subject.countDocuments({ guidanceId: '' });
        console.log(`\nSubjects with NO guidanceId: ${orphanCount}`);
        console.log(`Subjects with EMPTY guidanceId: ${emptyCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

analyzeData();
