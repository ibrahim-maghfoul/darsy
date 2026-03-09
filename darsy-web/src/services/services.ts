import api from "@/lib/api";

export const getSchoolServices = async () => {
    try {
        const res = await api.get('/data/school-services');
        return res.data || [];
    } catch (err) {
        console.error('Failed to fetch school services', err);
        return [];
    }
};

export const getSchoolServiceById = async (id: string) => {
    try {
        // Since we don't have a specific get by ID endpoint yet, we can filter from all
        // or just use the general get if the backend supports it.
        // For now, let's assume we fetch all and find, or just call the endpoint if it exists.
        const res = await api.get(`/data/school-services`);
        const services = res.data || [];
        return services.find((s: any) => s._id === id);
    } catch (err) {
        console.error('Failed to fetch school service detail', err);
        return null;
    }
};
