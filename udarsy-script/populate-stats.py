from pymongo import MongoClient
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from the backend folder
env_path = os.path.join(os.path.dirname(__file__), '..', 'darsy-backend', '.env')
load_dotenv(dotenv_path=env_path)

# Connection URI
MONGO_URI = os.environ.get("MONGODB_URI")

def populate_course_stats():
    """
    Connects to MongoDB, calculates aggregate statistics from various collections,
    and updates the 'dashboard_stats' report document.
    """
    print("🔌 Starting statistics population...")
    client = None
    try:
        if not MONGO_URI:
            print("❌ MONGODB_URI not found. Please check your .env file.")
            return

        client = MongoClient(MONGO_URI)
        db = client.get_database()
        print("✅ Connected to MongoDB.")

        # 1. Level/Guidance Stats
        print("📊 Analyzing guidances and subjects...")
        guidances = list(db['guidances'].find())
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
            
            subjects = list(db['subjects'].find({"guidanceId": gid}))
            subject_ids = [str(s['_id']) for s in subjects]
            
            # Assuming lesson collection references subjectId
            lessons = list(db['lessons'].find({"subjectId": {"$in": subject_ids}}))

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

            # Aggregate to overall
            overall_stat["totalPdfs"] += stats["totalPdfs"]
            overall_stat["totalVideos"] += stats["totalVideos"]
            overall_stat["totalExercises"] += stats["totalExercises"]
            overall_stat["totalExams"] += stats["totalExams"]
            overall_stat["totalLessons"] += stats["totalLessons"]
            overall_stat["totalSubjects"] += stats["totalSubjects"]
            overall_stat["totalResources"] += stats["totalResources"]

        overall_stat["totalItems"] = (
            overall_stat["totalPdfs"] + 
            overall_stat["totalVideos"] + 
            overall_stat["totalExercises"] + 
            overall_stat["totalExams"] + 
            overall_stat["totalResources"]
        )

        # 2. News Stats
        print("📰 Analyzing news articles...")
        news_count = db['news'].count_documents({})
        overall_stat["totalNews"] = news_count
        
        # News by category
        news_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$project": {"category": "$_id", "count": 1, "_id": 0}}
        ]
        news_stat = list(db['news'].aggregate(news_pipeline))

        # 3. User Stats
        print("👥 Counting users...")
        overall_stat["totalUsers"] = db['users'].count_documents({})

        # 4. Contribution Stats
        print("🛠️ Analyzing contributions...")
        contributions = list(db['contributions'].find())
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

        # 5. Feedback Stats
        print("💬 Analyzing feedback...")
        feedback_pipeline = [
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$project": {"type": "$_id", "count": 1, "_id": 0}}
        ]
        feedback_types = list(db['feedbacks'].aggregate(feedback_pipeline))
        feedback_total = sum(f['count'] for f in feedback_types)
        
        feedback_stat = {
            "total": feedback_total,
            "byType": feedback_types
        }

        # Final Report Data
        final_report = {
            "type": "dashboard_stats",
            "levelsStat": levels_stat,
            "newsStat": news_stat,
            "contributionStat": contribution_stat,
            "feedbackStat": feedback_stat,
            "overallStat": overall_stat,
            "updatedAt": datetime.utcnow()
        }

        print("💾 Saving stats to 'reports' collection...")
        result = db['reports'].update_one(
            {"type": "dashboard_stats"},
            {"$set": final_report},
            upsert=True
        )

        if result.upserted_id:
            print("✨ Created new dashboard_stats report.")
        else:
            print("✨ Updated existing dashboard_stats report.")
        
        print("\n--- Summary ---")
        print(f"Total Subjects: {overall_stat['totalSubjects']}")
        print(f"Total Lessons:  {overall_stat['totalLessons']}")
        print(f"Total Users:    {overall_stat['totalUsers']}")
        print("Success!")
        
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        if client:
            client.close()
            print("🔌 MongoDB connection closed.")

if __name__ == "__main__":
    populate_course_stats()
