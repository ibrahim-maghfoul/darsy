import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type EducationLevel = 'primary' | 'middle' | 'secondary';

export function getEducationCategory(school?: string, level?: string): EducationLevel {
    const s = school?.toLowerCase() || '';
    const l = level?.toLowerCase() || '';

    const isPrimary = s.includes('primar') || l.includes('primar') ||
        l.includes('ابتدا') || s.includes('ابتدا');
    const isSecondary = s.includes('secondar') || l.includes('secondar') ||
        l.includes('lycée') || l.includes('ثانوي') ||
        s.includes('lycée') || s.includes('ثانوي');

    if (isPrimary) return 'primary';
    if (isSecondary) return 'secondary';
    return 'middle';
}

// Map common education level names to French equivalents
export function formatLevelDisplay(school: string, level: string, guidance: string): {
    category: string;
    fullPath: string;
} {
    const s = school?.toLowerCase() || '';
    const l = level?.toLowerCase() || '';

    // Check if this is French/Moroccan Lycée system
    const isLycee = s.includes('lycée') || l.includes('lycée') || s.includes('secondar');

    if (isLycee) {
        // Display French labels for Lycée system
        return {
            category: 'Lycée',
            fullPath: `Lycée / ${level} / ${guidance}`
        };
    }

    // Default display for other systems
    const category = getEducationCategory(school, level);
    const categoryLabel = category === 'primary' ? 'Primary' :
        category === 'secondary' ? 'Secondary' :
            'Middle';

    return {
        category: `${categoryLabel} Level Student`,
        fullPath: `${school} / ${level} / ${guidance}`
    };
}

