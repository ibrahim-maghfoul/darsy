const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../darsy-backend/.env') });

const uri = process.env.MONGODB_URI;

async function run() {
    console.log("🔌 Connecting with native driver...");
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("✅ Connected!");
        const db = client.db();

        // 1. Level/Guidance Stats
        const guidances = await db.collection('guidances').find().toArray();
        console.log(`📊 Analyzing ${guidances.length} guidances...`);

        const levelsStat = [];
        const overallStat = {
            totalPdfs: 0,
            totalVideos: 0,
            totalExercises: 0,
            totalExams: 0,
            totalLessons: 0,
            totalSubjects: 0,
            totalResources: 0,
            totalItems: 0,
            totalUsers: 0,
            totalNews: 0
        };

        for (const guidance of guidances) {
            const gid = guidance._id.toString();
            console.log(`🔎 Processing Level: ${guidance.title || 'Untitled'} (${gid})`);

            const subjects = await db.collection('subjects').find({ guidanceId: gid }).toArray();
            const subjectIds = subjects.map(s => s._id.toString());
            const lessons = await db.collection('lessons').find({ subjectId: { $in: subjectIds } }).toArray();

            const stats = {
                guidanceId: gid,
                title: guidance.title || 'Untitled',
                totalPdfs: 0,
                totalVideos: 0,
                totalExercises: 0,
                totalExams: 0,
                totalLessons: lessons.length,
                totalSubjects: subjects.length,
                totalResources: 0,
            };

            for (const lesson of lessons) {
                stats.totalPdfs += (lesson.coursesPdf || []).length;
                stats.totalVideos += (lesson.videos || []).length;
                stats.totalExercises += (lesson.exercices || []).length;
                stats.totalExams += (lesson.exams || []).length;
                stats.totalResources += (lesson.resourses || []).length;
            }

            levelsStat.push(stats);

            overallStat.totalPdfs += stats.totalPdfs;
            overallStat.totalVideos += stats.totalVideos;
            overallStat.totalExercises += stats.totalExercises;
            overallStat.totalExams += stats.totalExams;
            overallStat.totalLessons += stats.totalLessons;
            overallStat.totalSubjects += stats.totalSubjects;
            overallStat.totalResources += stats.totalResources;
        }
        overallStat.totalItems = overallStat.totalPdfs + overallStat.totalVideos + overallStat.totalExercises + overallStat.totalExams + overallStat.totalResources;

        // 2. News Stats
        console.log("📰 Analyzing news...");
        const news = await db.collection('news').find().toArray();
        overallStat.totalNews = news.length;
        const newsStatMap = {};
        news.forEach(n => {
            const cat = n.category || 'General';
            newsStatMap[cat] = (newsStatMap[cat] || 0) + 1;
        });
        const newsStat = Object.entries(newsStatMap).map(([category, count]) => ({ category, count }));

        // 3. Contribution Stats
        console.log("🛠️ Analyzing contributions...");
        const contributions = await db.collection('contributions').find().toArray();
        const contributionStat = {
            total: contributions.length,
            pending: contributions.filter(c => c.status === 'pending').length,
            approved: contributions.filter(c => c.status === 'approved').length,
            rejected: contributions.filter(c => c.status === 'rejected').length,
            byGuidance: []
        };
        const contribGuidanceMap = {};
        contributions.forEach(c => {
            if (c.guidanceId) {
                contribGuidanceMap[c.guidanceId] = (contribGuidanceMap[c.guidanceId] || 0) + 1;
            }
        });
        contributionStat.byGuidance = Object.entries(contribGuidanceMap).map(([guidanceId, count]) => ({ guidanceId, count }));

        // 4. Feedback Stats
        console.log("💬 Analyzing feedback...");
        const feedbacks = await db.collection('feedbacks').find().toArray();
        const feedbackStat = {
            total: feedbacks.length,
            byType: []
        };
        const feedbackTypeMap = {};
        feedbacks.forEach(f => {
            feedbackTypeMap[f.type] = (feedbackTypeMap[f.type] || 0) + 1;
        });
        feedbackStat.byType = Object.entries(feedbackTypeMap).map(([type, count]) => ({ type, count }));

        // 5. User Counts
        const userCount = await db.collection('users').countDocuments();
        overallStat.totalUsers = userCount;

        // Final Report Assembly
        const finalReport = {
            type: 'dashboard_stats',
            levelsStat,
            newsStat,
            contributionStat,
            feedbackStat,
            overallStat,
            updatedAt: new Date()
        };

        // Update the reports collection
        console.log("💾 Saving consolidated report to 'reports' collection...");
        await db.collection('reports').updateOne(
            { type: 'dashboard_stats' },
            { $set: finalReport },
            { upsert: true }
        );

        console.log("🚀 Done!");
        console.log("Summary:", {
            levels: levelsStat.length,
            news: overallStat.totalNews,
            users: overallStat.totalUsers,
            totalItems: overallStat.totalItems
        });

    } catch (err) {
        console.error("❌ Fatal Error:", err);
    } finally {
        await client.close();
    }
}

run();
