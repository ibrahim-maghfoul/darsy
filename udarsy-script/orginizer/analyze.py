"""
analyze.py - Python equivalent of analyze.js
Collects statistics from the database and saves a dashboard_stats report.
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load .env from darsy-backend
env_path = Path(__file__).resolve().parent.parent.parent / 'darsy-backend' / '.env'
load_dotenv(dotenv_path=env_path)

MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("❌ MONGODB_URI not found in .env")
    sys.exit(1)

def run():
    print("🔌 Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()

    try:
        print("✅ Connected!")

        # 1. Level/Guidance Stats
        guidances = list(db.guidances.find())
        print(f"📊 Analyzing {len(guidances)} guidances...")

        levels_stat = []
        overall_stat = {
            "totalPdfs": 0,
            "totalVideos": 0,
            "totalExercises": 0,
            "totalExams": 0,
            "totalLessons": 0,
            "totalSubjects": 0,
            "totalResources": 0,
            "totalItems": 0,
            "totalUsers": 0,
            "totalNews": 0
        }

        for guidance in guidances:
            gid = str(guidance.get('_id', ''))
            title = guidance.get('title', 'Untitled')
            print(f"🔎 Processing Level: {title} ({gid})")

            subjects = list(db.subjects.find({"guidanceId": gid}))
            subject_ids = [str(s['_id']) for s in subjects]
            
            # Assuming lesson collection references subjectId as a string
            lessons = list(db.lessons.find({"subjectId": {"$in": subject_ids}}))

            stats = {
                "guidanceId": gid,
                "title": title,
                "totalPdfs": 0,
                "totalVideos": 0,
                "totalExercises": 0,
                "totalExams": 0,
                "totalLessons": len(lessons),
                "totalSubjects": len(subjects),
                "totalResources": 0,
            }

            for lesson in lessons:
                stats["totalPdfs"] += len(lesson.get('coursesPdf', []))
                stats["totalVideos"] += len(lesson.get('videos', []))
                stats["totalExercises"] += len(lesson.get('exercices', []))
                stats["totalExams"] += len(lesson.get('exams', []))
                stats["totalResources"] += len(lesson.get('resourses', []))

            levels_stat.append(stats)

            overall_stat["totalPdfs"] += stats["totalPdfs"]
            overall_stat["totalVideos"] += stats["totalVideos"]
            overall_stat["totalExercises"] += stats["totalExercises"]
            overall_stat["totalExams"] += stats["totalExams"]
            overall_stat["totalLessons"] += stats["totalLessons"]
            overall_stat["totalSubjects"] += stats["totalSubjects"]
            overall_stat["totalResources"] += stats["totalResources"]

        overall_stat["totalItems"] = (overall_stat["totalPdfs"] + 
                                      overall_stat["totalVideos"] + 
                                      overall_stat["totalExercises"] + 
                                      overall_stat["totalExams"] + 
                                      overall_stat["totalResources"])

        # 2. News Stats
        print("📰 Analyzing news...")
        news = list(db.news.find())
        overall_stat["totalNews"] = len(news)
        news_stat_map = {}
        for n in news:
            cat = n.get('category', 'General')
            news_stat_map[cat] = news_stat_map.get(cat, 0) + 1
        news_stat = [{"category": k, "count": v} for k, v in news_stat_map.items()]

        # 3. Contribution Stats
        print("🛠️ Analyzing contributions...")
        contributions = list(db.contributions.find())
        contrib_guidance_map = {}
        for c in contributions:
            g_id = c.get('guidanceId')
            if g_id:
                contrib_guidance_map[g_id] = contrib_guidance_map.get(g_id, 0) + 1
        
        contribution_stat = {
            "total": len(contributions),
            "pending": len([c for c in contributions if c.get('status') == 'pending']),
            "approved": len([c for c in contributions if c.get('status') == 'approved']),
            "rejected": len([c for c in contributions if c.get('status') == 'rejected']),
            "byGuidance": [{"guidanceId": k, "count": v} for k, v in contrib_guidance_map.items()]
        }

        # 4. Feedback Stats
        print("💬 Analyzing feedback...")
        feedbacks = list(db.feedbacks.find())
        feedback_type_map = {}
        for f in feedbacks:
            t = f.get('type', 'unknown')
            feedback_type_map[t] = feedback_type_map.get(t, 0) + 1
            
        feedback_stat = {
            "total": len(feedbacks),
            "byType": [{"type": k, "count": v} for k, v in feedback_type_map.items()]
        }

        # 5. User Counts
        user_count = db.users.count_documents({})
        overall_stat["totalUsers"] = user_count

        # Final Report Assembly
        final_report = {
            "type": "dashboard_stats",
            "levelsStat": levels_stat,
            "newsStat": news_stat,
            "contributionStat": contribution_stat,
            "feedbackStat": feedback_stat,
            "overallStat": overall_stat,
            "updatedAt": datetime.utcnow()
        }

        print("💾 Saving consolidated report to 'reports' collection...")
        db.reports.update_one(
            {"type": "dashboard_stats"},
            {"$set": final_report},
            upsert=True
        )

        print("🚀 Done!")
        print(f"Summary: levels={len(levels_stat)}, news={overall_stat['totalNews']}, "
              f"users={overall_stat['totalUsers']}, totalItems={overall_stat['totalItems']}")

    except Exception as e:
        print(f"❌ Fatal Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
