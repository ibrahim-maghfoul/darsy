const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function rawInspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Subject = mongoose.model('Subject', new mongoose.Schema({
            _id: String,
            title: String,
            guidanceId: String
        }, { collection: 'subjects', _id: false }));

        const subjects = await Subject.find().limit(20);
        console.log('Sample Subjects:');
        subjects.forEach(s => {
            console.log(`- ${s.title}: guidanceId=${s.guidanceId}`);
        });

        const Guidance = mongoose.model('Guidance', new mongoose.Schema({
            _id: String,
            title: String
        }, { collection: 'guidances', _id: false }));

        const guidances = await Guidance.find().limit(20);
        console.log('\nSample Guidances:');
        guidances.forEach(g => {
            console.log(`- ${g.title}: _id=${g._id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

rawInspect();
