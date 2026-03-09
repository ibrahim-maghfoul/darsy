const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function aggregateData() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Subject = mongoose.model('Subject', new mongoose.Schema({
            guidanceId: String
        }, { collection: 'subjects' }));

        const Guidance = mongoose.model('Guidance', new mongoose.Schema({
            _id: String,
            title: String
        }, { collection: 'guidances' }));

        const results = await Subject.aggregate([
            { $group: { _id: '$guidanceId', count: { $sum: 1 } } }
        ]);

        console.log('Subject Distribution by guidanceId:');
        for (const res of results) {
            const guidance = await Guidance.findOne({ _id: res._id });
            console.log(`- guidanceId: "${res._id}" (${guidance ? guidance.title : 'UNKNOWN'}) -> Count: ${res.count}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

aggregateData();
