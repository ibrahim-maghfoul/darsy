require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy');
    const news = await mongoose.connection.db.collection('news').find({}, { projection: { title: 1, category: 1, type: 1 } }).toArray();
    console.log('Total:', news.length);
    console.log('Etudiant:', news.filter(n => n.category === 'Etudiant').length);
    console.log('Bac:', news.filter(n => n.category === 'Bac').length);
    console.log('College:', news.filter(n => n.category === 'College').length);
    console.log('Sample Etudiant cards:');
    news.filter(n => n.category === 'Etudiant').slice(0, 5).forEach(n => console.log(n));
    console.log('Sample Bac cards:');
    news.filter(n => n.category === 'Bac').slice(0, 5).forEach(n => console.log(n));
    process.exit(0);
}

check().catch(console.error);
