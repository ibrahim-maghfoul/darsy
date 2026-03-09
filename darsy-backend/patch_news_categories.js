/**
 * patch_news_categories.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script to fix articles whose `category` was incorrectly stored
 * as the article type (e.g. "Résultats") instead of the scraper category
 * (e.g. "Bac", "Etudiant", "College").
 *
 * Usage:
 *   node patch_news_categories.js
 *
 * Requirements:
 *   - .env must contain MONGODB_URI
 *   - tawjihnet_full.json must exist next to this script
 *     (or update JSON_PATH below)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';
const JSON_PATH = path.join(__dirname, '..', 'tawjihnet_full.json');

async function run() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Load the scraped JSON
    if (!fs.existsSync(JSON_PATH)) {
        console.error(`JSON not found at: ${JSON_PATH}`);
        process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    const articles = raw.articles || [];
    console.log(`Loaded ${articles.length} articles from JSON.`);

    const db = mongoose.connection.db;
    const col = db.collection('news');

    let fixed = 0;
    let skipped = 0;

    for (const art of articles) {
        const id = (art.id ?? art._id)?.toString();
        if (!id || !art.category) { skipped++; continue; }

        // Only fix articles where category is NOT a scraper category
        const scraperCategories = ['Bac', 'Etudiant', 'College'];
        const result = await col.updateOne(
            {
                _id: id,
                category: { $nin: scraperCategories }  // Only update if wrong
            },
            {
                $set: {
                    category: art.category,
                    type: art.type || 'Information',
                }
            }
        );

        if (result.modifiedCount > 0) {
            fixed++;
            if (fixed % 50 === 0) console.log(`  Fixed ${fixed} articles so far...`);
        } else {
            skipped++;
        }
    }

    console.log(`\nDone! Fixed: ${fixed}, Skipped (already correct or missing): ${skipped}`);
    await mongoose.disconnect();
    console.log('Disconnected.');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
