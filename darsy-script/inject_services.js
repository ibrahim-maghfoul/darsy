const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../darsy-backend/.env') });

const uri = process.env.MONGODB_URI;
const dataFile = path.join(__dirname, 'moutamadriss-scraper/moutamadris_content.json');

async function run() {
    if (!fs.existsSync(dataFile)) {
        console.error("❌ Data file not found:", dataFile);
        return;
    }

    const rawData = fs.readFileSync(dataFile, 'utf8');
    const data = JSON.parse(rawData);

    console.log("🔌 Connecting to MongoDB...");
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('schoolservices');

        const serviceDoc = {
            title: data.title || "School Vacations",
            description: "Official 2025-2026 school vacation list and academic calendar.",
            icon: "calendar_today", // Material icon name
            category: "vacation",
            content_blocks: data.content_blocks || [],
            externalUrl: data.url,
            isActive: true,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log("💾 Injecting service:", serviceDoc.title);

        await collection.updateOne(
            { externalUrl: serviceDoc.externalUrl },
            { $set: serviceDoc },
            { upsert: true }
        );

        console.log("✅ Successfully injected Moutamadris service!");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
    }
}

run();
