import api from "@/lib/api";
import { School, Level, Guidance, Subject, Lesson } from "@/types";

export const getSchools = async (): Promise<School[]> => {
    const res = await api.get('/data/schools');
    return res.data.map((s: any) => ({ ...s, id: s._id }));
};

export const getLevels = async (schoolId: string): Promise<Level[]> => {
    const res = await api.get(`/data/levels/${schoolId}`);
    return res.data.map((l: any) => ({ ...l, id: l._id }));
};

export const getGuidances = async (levelId: string): Promise<Guidance[]> => {
    const res = await api.get(`/data/guidances/${levelId}`);
    return res.data.map((g: any) => ({ ...g, id: g._id }));
};

export const getSubjects = async (guidanceId: string): Promise<Subject[]> => {
    const res = await api.get(`/data/subjects/${guidanceId}`);
    return res.data.map((s: any) => ({ ...s, id: s._id }));
};

export const getLessons = async (subjectId: string): Promise<Lesson[]> => {
    const res = await api.get(`/data/lessons/${subjectId}`);
    return res.data.map((l: any) => ({ ...l, id: l._id }));
};

export const getLessonById = async (lessonId: string): Promise<Lesson | null> => {
    try {
        const res = await api.get(`/data/lesson/${lessonId}`);
        if (!res.data?._id) return null;
        return { ...res.data, id: res.data._id };
    } catch {
        return null;
    }
};

// No-op prefetch stubs — kept so callers don't break
export function prefetchLevels(_schoolId: string) {}
export function prefetchGuidances(_levelId: string) {}
export function prefetchSubjects(_guidanceId: string) {}
export function prefetchLessons(_subjectId: string) {}
