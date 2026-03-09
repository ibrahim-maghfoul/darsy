const fs = require('fs');
const path = require('path');

const subjectsPath = path.join(__dirname, '..', 'firebase_data', 'metadata', 'subjects.json');
const lessonsPath = path.join(__dirname, '..', 'firebase_data', 'metadata', 'lessons.json');

const subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf8'));
const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));

const guidanceGroups = {};

subjects.forEach(s => {
    if (!guidanceGroups[s.guidanceId]) guidanceGroups[s.guidanceId] = {};
    if (!guidanceGroups[s.guidanceId][s.title]) guidanceGroups[s.guidanceId][s.title] = [];
    guidanceGroups[s.guidanceId][s.title].push(s.id);
});

console.log('--- DUPLICATE SUBJECTS ANALYSIS ---');

Object.keys(guidanceGroups).forEach(guidanceId => {
    const group = guidanceGroups[guidanceId];
    Object.keys(group).forEach(title => {
        if (group[title].length > 1) {
            console.log(`Guidance ${guidanceId}: "${title}" has ${group[title].length} IDs: ${group[title].join(', ')}`);

            const allLessonTitles = [];
            group[title].forEach(id => {
                const subjectLessons = lessons.filter(l => l.subjectId === id);
                console.log(`  - ID ${id}: ${subjectLessons.length} lessons`);
                subjectLessons.forEach(l => allLessonTitles.push(l.title));
            });

            const uniqueTitles = new Set(allLessonTitles);
            if (uniqueTitles.size < allLessonTitles.length) {
                console.log(`  !!! Duplicate lessons found: ${allLessonTitles.length - uniqueTitles.size} duplicates`);
            }
        }
    });
});
