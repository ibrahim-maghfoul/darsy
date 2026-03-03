import api from "@/lib/api";
import type { School, Level, Guidance, Subject, Lesson } from "@/types";

// Cache for metadata to avoid repeated reads
// In a real app, use SWR or React Query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CACHE: Record<string, any> = {};

export async function getSchools(): Promise<School[]> {
    if (CACHE['schools']) return CACHE['schools'];

    try {
        const response = await api.get('/data/schools');
        // Map _id to id
        const schools = response.data.map((item: any) => ({ ...item, id: item._id }));
        CACHE['schools'] = schools;
        return schools;
    } catch (error) {
        console.error("Error fetching schools:", error);
        return [];
    }
}

export async function getLevels(schoolId: string): Promise<Level[]> {
    try {
        const response = await api.get(`/data/levels/${schoolId}`);
        return response.data.map((item: any) => ({ ...item, id: item._id }));
    } catch (error) {
        console.error(`Error fetching levels for school ${schoolId}:`, error);
        return [];
    }
}

export async function getGuidances(levelId: string): Promise<Guidance[]> {
    try {
        const response = await api.get(`/data/guidances/${levelId}`);
        return response.data.map((item: any) => ({ ...item, id: item._id }));
    } catch (error) {
        console.error(`Error fetching guidances for level ${levelId}:`, error);
        return [];
    }
}

export async function getSubjects(guidanceId: string): Promise<Subject[]> {
    try {
        const response = await api.get(`/data/subjects/${guidanceId}`);
        return response.data.map((item: any) => ({ ...item, id: item._id }));
    } catch (error) {
        console.error(`Error fetching subjects for guidance ${guidanceId}:`, error);
        return [];
    }
}

export async function getLessons(subjectId: string): Promise<Lesson[]> {
    try {
        const response = await api.get(`/data/lessons/${subjectId}`);
        return response.data.map((item: any) => ({ ...item, id: item._id }));
    } catch (error) {
        console.error(`Error fetching lessons for subject ${subjectId}:`, error);
        return [];
    }
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
        const response = await api.get(`/data/lesson/${lessonId}`);
        const data = response.data;
        return data ? { ...data, id: data._id } : null;
    } catch (error) {
        console.error(`Error fetching lesson ${lessonId}:`, error);
        return null;
    }
}

// News
export const getNews = async () => {
    try {
        const response = await api.get('/news');
        return response.data;
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
};


export const getGuidanceStats = async (guidanceId: string) => {
    try {
        const response = await api.get(`/data/guidance-stats/${guidanceId}`);
        return response.data;
    } catch (error: any) {
        // 404 is expected when stats haven't been generated yet
        if (error?.response?.status !== 404) {
            console.error("Error fetching guidance stats:", error);
        }
        return null;
    }
};


export const getNewsById = async (id: string) => {
    try {
        const response = await api.get(`/news/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching news detail:", error);
        return null;
    }
};
