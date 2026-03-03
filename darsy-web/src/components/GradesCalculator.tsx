"use client";

import { useState } from "react";
import { Calculator, Plus, Trash2, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface SubjectEntry {
    subject: string;
    coefficient: string;
    numExams: number;
    examGrades: string[];
}

export default function GradesCalculator() {
    const t = useTranslations("Settings");
    const [subjects, setSubjects] = useState<SubjectEntry[]>([
        { subject: "", coefficient: "", numExams: 1, examGrades: [""] }
    ]);

    const updateSubject = (index: number, field: keyof SubjectEntry, value: any) => {
        const updated = [...subjects];
        updated[index] = { ...updated[index], [field]: value };
        setSubjects(updated);
    };

    const setNumExams = (index: number, num: number) => {
        const updated = [...subjects];
        const current = updated[index];
        const newGrades = Array(num).fill("").map((_, i) => current.examGrades[i] ?? "");
        updated[index] = { ...current, numExams: num, examGrades: newGrades };
        setSubjects(updated);
    };

    const setExamGrade = (subjectIdx: number, examIdx: number, value: string) => {
        const updated = [...subjects];
        const grades = [...updated[subjectIdx].examGrades];
        grades[examIdx] = value;
        updated[subjectIdx] = { ...updated[subjectIdx], examGrades: grades };
        setSubjects(updated);
    };

    const addSubject = () =>
        setSubjects([...subjects, { subject: "", coefficient: "", numExams: 1, examGrades: [""] }]);

    const removeSubject = (index: number) =>
        setSubjects(subjects.filter((_, i) => i !== index));

    const getSubjectAvg = (s: SubjectEntry): number | null => {
        const validGrades = s.examGrades
            .map(g => parseFloat(g))
            .filter(g => !isNaN(g));
        if (validGrades.length === 0) return null;
        return validGrades.reduce((a, b) => a + b, 0) / validGrades.length;
    };

    const calculateGPA = (): string => {
        let totalPoints = 0;
        let totalCoeff = 0;
        subjects.forEach(s => {
            const avg = getSubjectAvg(s);
            const coeff = parseFloat(s.coefficient);
            if (avg !== null && !isNaN(coeff) && coeff > 0) {
                totalPoints += avg * coeff;
                totalCoeff += coeff;
            }
        });
        return totalCoeff > 0 ? (totalPoints / totalCoeff).toFixed(2) : "—";
    };

    const gpa = calculateGPA();

    return (
        <section className="space-y-6 p-8 rounded-[40px] bg-white border border-green/10 shadow-2xl shadow-green/5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
                        <Calculator className="text-green" size={24} />
                        {t("gpa_title")}
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-green uppercase tracking-widest">{t("your_average")}</p>
                    <p className={`text-4xl font-extrabold ${gpa === "—" ? "text-dark/20" : "text-green"}`}>{gpa}</p>
                </div>
            </div>

            {/* Subject Rows */}
            <div className="space-y-5">
                {subjects.map((s, si) => {
                    const avg = getSubjectAvg(s);
                    return (
                        <div key={si} className="p-5 rounded-3xl bg-green/[0.03] border border-green/10 space-y-4">
                            {/* Subject name + coeff + remove */}
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-xs font-bold text-dark/40 uppercase ml-1">{t("subject")}</label>
                                    <input
                                        type="text"
                                        placeholder={t("math_placeholder")}
                                        value={s.subject}
                                        onChange={e => updateSubject(si, "subject", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-2xl bg-white border border-green/10 focus:border-green outline-none font-medium transition-all text-sm"
                                    />
                                </div>
                                <div className="w-full sm:w-24 space-y-1.5">
                                    <label className="text-xs font-bold text-dark/40 uppercase ml-1">{t("coeff")}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="2"
                                        value={s.coefficient}
                                        onChange={e => updateSubject(si, "coefficient", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-2xl bg-white border border-green/10 focus:border-green outline-none font-bold transition-all text-sm text-center"
                                    />
                                </div>
                                {/* Number of exams selector */}
                                <div className="w-full sm:w-32 space-y-1.5">
                                    <label className="text-xs font-bold text-dark/40 uppercase ml-1">{t("exams")}</label>
                                    <div className="relative">
                                        <select
                                            value={s.numExams}
                                            onChange={e => setNumExams(si, parseInt(e.target.value))}
                                            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-green/10 focus:border-green outline-none font-bold transition-all text-sm text-center appearance-none cursor-pointer"
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(n => (
                                                <option key={n} value={n}>{n} {n > 1 ? t("exams").toLowerCase() : t("exam").toLowerCase()}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeSubject(si)}
                                    disabled={subjects.length === 1}
                                    className="p-2.5 rounded-2xl text-red-400 hover:bg-red-50 transition-all disabled:opacity-20"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Exam grade inputs */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {Array.from({ length: s.numExams }).map((_, ei) => (
                                    <div key={ei} className="space-y-1">
                                        <label className="text-[10px] font-bold text-dark/30 uppercase ml-1">
                                            {t("exam")} {ei + 1}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            placeholder="—"
                                            value={s.examGrades[ei] ?? ""}
                                            onChange={e => setExamGrade(si, ei, e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-green/10 focus:border-green outline-none font-bold text-sm text-center transition-all"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Per-subject average */}
                            {avg !== null && (
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-xs text-dark/40 font-medium">
                                        {t("average")}: <span className="font-black text-green">{avg.toFixed(2)}</span>
                                        {s.coefficient && !isNaN(parseFloat(s.coefficient)) && (
                                            <> × coeff <span className="font-black text-dark">{s.coefficient}</span> = <span className="font-black text-green">{(avg * parseFloat(s.coefficient)).toFixed(2)}</span> pts</>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add subject button */}
            <button
                onClick={addSubject}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-green/20 text-green font-bold hover:bg-green/5 hover:border-green transition-all flex items-center justify-center gap-2 text-sm"
            >
                <Plus size={18} />
                {t("add_subject")}
            </button>
        </section>
    );
}
