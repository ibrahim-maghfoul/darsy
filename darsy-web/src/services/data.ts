import api from "@/lib/api";
import { School, Level, Guidance, Subject, Lesson } from "@/types";

export const getSchools = async (): Promise<School[]> => {
    try {
        const res = await api.get('/data/schools');
        return res.data.map((s: any) => ({ ...s, id: s._id }));
    } catch (error) {
        console.error("Error fetching schools:", error);
        return [];
    }
};

export const getLevels = async (schoolId: string): Promise<Level[]> => {
    try {
        const res = await api.get(`/data/levels/${schoolId}`);
        return res.data.map((l: any) => ({ ...l, id: l._id }));
    } catch (error) {
        console.error("Error fetching levels:", error);
        return [];
    }
};

export const getGuidances = async (levelId: string): Promise<Guidance[]> => {
    try {
        const res = await api.get(`/data/guidances/${levelId}`);
        return res.data.map((g: any) => ({ ...g, id: g._id }));
    } catch (error) {
        console.error("Error fetching guidances:", error);
        return [];
    }
};

export const getSubjects = async (guidanceId: string): Promise<Subject[]> => {
    try {
        const res = await api.get(`/data/subjects/${guidanceId}`);
        return res.data.map((s: any) => ({ ...s, id: s._id }));
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return [];
    }
};

export const getLessons = async (subjectId: string): Promise<Lesson[]> => {
    try {
        const res = await api.get(`/data/lessons/${subjectId}`);
        return res.data.map((l: any) => ({ ...l, id: l._id }));
    } catch (error) {
        console.error("Error fetching lessons:", error);
        return [];
    }
};

export const getLessonById = async (lessonId: string): Promise<Lesson | null> => {
    try {
        const res = await api.get(`/data/lesson/${lessonId}`);
        return { ...res.data, id: res.data._id };
    } catch (error) {
        console.error("Error fetching lesson:", error);
        return null;
    }
};
