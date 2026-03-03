'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Plus, Minus, X, Info } from 'lucide-react';
import { EducationLevel } from '@/lib/firestore';

interface Subject {
    name: string;
    grade: string;
    coefficient: string;
}

const gradeDescriptors = {
    'Très bien': { min: 16, max: 20, color: 'text-green-600 dark:text-green-400' },
    'Bien': { min: 14, max: 15.99, color: 'text-purple-600 dark:text-purple-400' },
    'Assez bien': { min: 12, max: 13.99, color: 'text-cyan-600 dark:text-cyan-400' },
    'Passable': { min: 10, max: 11.99, color: 'text-yellow-600 dark:text-yellow-400' },
    'Insuffisant': { min: 0, max: 9.99, color: 'text-red-600 dark:text-red-400' },
};

const subjectTemplates: Record<EducationLevel, { name: string; coefficient: number }[]> = {
    primary: [
        { name: 'Arabic', coefficient: 3 },
        { name: 'French', coefficient: 3 },
        { name: 'Mathematics', coefficient: 3 },
        { name: 'Science', coefficient: 2 },
        { name: 'Social Studies', coefficient: 2 },
    ],
    middle: [
        { name: 'Arabic', coefficient: 3 },
        { name: 'French', coefficient: 3 },
        { name: 'Mathematics', coefficient: 3 },
        { name: 'Sciences (SVT)', coefficient: 2 },
        { name: 'Physics/Chemistry', coefficient: 2 },
        { name: 'History/Geography', coefficient: 2 },
        { name: 'Islamic Education', coefficient: 2 },
    ],
    secondary: [
        { name: 'Arabic', coefficient: 2 },
        { name: 'French', coefficient: 2 },
        { name: 'Mathematics', coefficient: 4 },
        { name: 'Sciences (SVT)', coefficient: 3 },
        { name: 'Physics/Chemistry', coefficient: 4 },
        { name: 'Philosophy', coefficient: 2 },
        { name: 'Islamic Education', coefficient: 2 },
        { name: 'History/Geography', coefficient: 2 },
    ],
};

interface GradesCalculatorProps {
    userLevel: EducationLevel;
}

export default function GradesCalculator({ userLevel }: GradesCalculatorProps) {
    const [subjects, setSubjects] = useState<Subject[]>(
        subjectTemplates[userLevel].map((s) => ({
            name: s.name,
            grade: '',
            coefficient: s.coefficient.toString(),
        }))
    );

    // Update subjects when level changes
    React.useEffect(() => {
        setSubjects(
            subjectTemplates[userLevel].map((s) => ({
                name: s.name,
                grade: '',
                coefficient: s.coefficient.toString(),
            }))
        );
    }, [userLevel]);

    const addSubject = () => {
        setSubjects([...subjects, { name: '', grade: '', coefficient: '1' }]);
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const updateSubject = (index: number, field: keyof Subject, value: string) => {
        const newSubjects = [...subjects];
        newSubjects[index][field] = value;
        setSubjects(newSubjects);
    };

    const calculateAverage = () => {
        let totalPoints = 0;
        let totalCoefficients = 0;

        subjects.forEach((subject) => {
            const grade = parseFloat(subject.grade);
            const coefficient = parseFloat(subject.coefficient);

            if (!isNaN(grade) && !isNaN(coefficient) && grade >= 0 && grade <= 20) {
                totalPoints += grade * coefficient;
                totalCoefficients += coefficient;
            }
        });

        return totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
    };

    const average = calculateAverage();
    const getDescriptor = (avg: number) => {
        for (const [descriptor, range] of Object.entries(gradeDescriptors)) {
            if (avg >= range.min && avg <= range.max) {
                return { descriptor, color: range.color };
            }
        }
        return { descriptor: '-', color: '' };
    };

    const { descriptor, color } = getDescriptor(average);

    return (
        <div className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Moroccan Grades Calculator</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Level: {userLevel.charAt(0).toUpperCase() + userLevel.slice(1)}
                    </p>
                </div>
            </div>

            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-900">
                <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-800 dark:text-purple-300">
                        <p className="font-semibold mb-1">Moroccan Grading Scale (0-20):</p>
                        <ul className="space-y-1">
                            <li>• 16-20: Très bien (Excellent)</li>
                            <li>• 14-15: Bien (Good)</li>
                            <li>• 12-13: Assez bien (Satisfactory)</li>
                            <li>• 10-11: Passable (Pass)</li>
                            <li>• 0-9: Insuffisant (Fail)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                {subjects.map((subject, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={subject.name}
                            onChange={(e) => updateSubject(index, 'name', e.target.value)}
                            placeholder="Subject name"
                            className="flex-1 px-3 py-2 border border-white/20 dark:border-violet-500/30 rounded-lg bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                            type="number"
                            value={subject.grade}
                            onChange={(e) => updateSubject(index, 'grade', e.target.value)}
                            placeholder="Grade (0-20)"
                            min="0"
                            max="20"
                            step="0.25"
                            className="w-28 px-3 py-2 border border-white/20 dark:border-violet-500/30 rounded-lg bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <input
                            type="number"
                            value={subject.coefficient}
                            onChange={(e) => updateSubject(index, 'coefficient', e.target.value)}
                            placeholder="Coef"
                            min="1"
                            step="1"
                            className="w-20 px-3 py-2 border border-white/20 dark:border-violet-500/30 rounded-lg bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                            onClick={() => removeSubject(index)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                ))}
            </div>

            <button
                onClick={addSubject}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-white/20 dark:border-violet-500/30 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
                <Plus className="w-5 h-5" />
                Add Subject
            </button>

            <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-900">
                <div className="text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Your Average</p>
                    <p className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {average.toFixed(2)} / 20
                    </p>
                    <p className={`text-xl font-semibold ${color}`}>{descriptor}</p>
                    {average >= 10 ? (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">✓ Passing Grade</p>
                    ) : average > 0 ? (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">✗ Below Passing (need 10/20)</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
