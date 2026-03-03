import { useState, useEffect } from 'react';
import {
    fetchSchools,
    fetchLevels,
    fetchGuidances,
    fetchSubjects,
    fetchLessons,
    clearAllCollections
} from '../services/firebase';
import './Lessons.css';

function Lessons({ setActiveTab }) {
    // State for filters
    const [schools, setSchools] = useState([]);
    const [levels, setLevels] = useState([]);
    const [guidances, setGuidances] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Selected filters
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedGuidance, setSelectedGuidance] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Lessons data
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);

    // Load schools on mount
    useEffect(() => {
        loadSchools();
    }, []);

    // Load levels when school changes
    useEffect(() => {
        if (selectedSchool) {
            loadLevels(selectedSchool);
            setSelectedLevel('');
            setSelectedGuidance('');
            setSelectedSubject('');
            setLessons([]);
        }
    }, [selectedSchool]);

    // Load guidances when level changes
    useEffect(() => {
        if (selectedLevel) {
            loadGuidances(selectedLevel);
            setSelectedGuidance('');
            setSelectedSubject('');
            setLessons([]);
        }
    }, [selectedLevel]);

    // Load subjects when guidance changes
    useEffect(() => {
        if (selectedGuidance) {
            loadSubjects(selectedGuidance);
            setSelectedSubject('');
            setLessons([]);
        }
    }, [selectedGuidance]);

    // Load lessons when subject changes
    useEffect(() => {
        if (selectedSubject) {
            loadLessons(true);
        }
    }, [selectedSubject]);

    // Auto-select "General" guidance for primary/middle school
    useEffect(() => {
        if (guidances.length > 0 && guidances.every(g => g.title === 'General')) {
            setSelectedGuidance(guidances[0].id);
        }
    }, [guidances]);

    async function loadSchools() {
        try {
            const data = await fetchSchools();
            setSchools(data);
        } catch (error) {
            console.error('Error loading schools:', error);
        }
    }

    async function loadLevels(schoolId) {
        try {
            const data = await fetchLevels(schoolId);
            setLevels(data);
            setGuidances([]);
            setSubjects([]);
        } catch (error) {
            console.error('Error loading levels:', error);
        }
    }

    async function loadGuidances(levelId) {
        try {
            const data = await fetchGuidances(levelId);
            setGuidances(data);
            setSubjects([]);
        } catch (error) {
            console.error('Error loading guidances:', error);
        }
    }

    async function loadSubjects(guidanceId) {
        try {
            const data = await fetchSubjects(guidanceId);
            setSubjects(data);
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

    async function loadLessons(reset = false) {
        if (!selectedSubject) return;

        setLoading(true);
        try {
            const filters = { subjectId: selectedSubject };
            const result = await fetchLessons(filters, 20, reset ? null : lastDoc);

            if (reset) {
                setLessons(result.lessons);
            } else {
                setLessons(prev => [...prev, ...result.lessons]);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);
        } catch (error) {
            console.error('Error loading lessons:', error);
        } finally {
            setLoading(false);
        }
    }

    // Check if we should hide guidance selector (for primary/middle school)
    const shouldShowGuidance = guidances.length > 0 &&
        !guidances.every(g => g.title === 'General');

    const handleDeleteAll = async () => {
        if (!window.confirm('⚠️ WARNING: This will PERMANENTLY DELETE all educational data from Firebase. Are you sure?')) {
            return;
        }

        setLoading(true);
        try {
            await clearAllCollections();
            alert('✅ All collections cleared successfully.');
            window.location.reload(); // Refresh to clear UI state
        } catch (error) {
            alert(`❌ Error clearing data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lessons-page">
            <div className="page-header">
                <h1>Lessons Browser</h1>
                <div className="header-actions">
                    <button
                        className="upload-btn-simple"
                        onClick={() => setActiveTab('database')}
                        style={{ marginRight: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        ☁️ Push to Firebase
                    </button>
                    <button
                        className="delete-all-btn-simple"
                        onClick={handleDeleteAll}
                        disabled={loading}
                    >
                        {loading ? '⏳ Clearing...' : '🗑️ Clear All Data'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-container">
                <div className="filter-group">
                    <label htmlFor="school-select">School:</label>
                    <select
                        id="school-select"
                        value={selectedSchool}
                        onChange={(e) => setSelectedSchool(e.target.value)}
                    >
                        <option value="">Select School</option>
                        {schools.map(school => (
                            <option key={school.id} value={school.id}>
                                {school.title}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedSchool && (
                    <div className="filter-group">
                        <label htmlFor="level-select">Level:</label>
                        <select
                            id="level-select"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                        >
                            <option value="">Select Level</option>
                            {levels.map(level => (
                                <option key={level.id} value={level.id}>
                                    {level.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedLevel && shouldShowGuidance && (
                    <div className="filter-group">
                        <label htmlFor="guidance-select">Guidance:</label>
                        <select
                            id="guidance-select"
                            value={selectedGuidance}
                            onChange={(e) => setSelectedGuidance(e.target.value)}
                        >
                            <option value="">Select Guidance</option>
                            {guidances.map(guidance => (
                                <option key={guidance.id} value={guidance.id}>
                                    {guidance.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedGuidance && (
                    <div className="filter-group">
                        <label htmlFor="subject-select">Subject:</label>
                        <select
                            id="subject-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Lessons List */}
            {selectedSubject && (
                <div className="lessons-container">
                    <h2>Lessons</h2>
                    {lessons.length === 0 && !loading && (
                        <p className="no-lessons">No lessons found for this subject.</p>
                    )}

                    <div className="lessons-grid">
                        {lessons.map(lesson => (
                            <div
                                key={lesson.id}
                                className="lesson-card"
                                onClick={() => setSelectedLesson(lesson)}
                            >
                                <h3>{lesson.title}</h3>
                                <div className="lesson-stats">
                                    {lesson.coursesPdf && (
                                        <span>📄 {lesson.coursesPdf.length} PDFs</span>
                                    )}
                                    {lesson.videos && (
                                        <span>🎥 {lesson.videos.length} Videos</span>
                                    )}
                                    {lesson.exercices && (
                                        <span>✏️ {lesson.exercices.length} Exercises</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {loading && <div className="loading">Loading more lessons...</div>}

                    {hasMore && !loading && (
                        <button
                            className="load-more-btn"
                            onClick={() => loadLessons(false)}
                        >
                            Load More
                        </button>
                    )}
                </div>
            )}

            {/* Lesson Detail Modal */}
            {selectedLesson && (
                <div className="lesson-modal" onClick={() => setSelectedLesson(null)}>
                    <div className="lesson-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedLesson(null)}>×</button>
                        <h2>{selectedLesson.title}</h2>

                        {selectedLesson.coursesPdf && selectedLesson.coursesPdf.length > 0 && (
                            <div className="resource-section">
                                <h3>📄 Course PDFs</h3>
                                <ul>
                                    {selectedLesson.coursesPdf.map((pdf, idx) => (
                                        <li key={idx}>
                                            <a href={pdf.url} target="_blank" rel="noopener noreferrer">
                                                {pdf.title || `PDF ${idx + 1}`}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedLesson.videos && selectedLesson.videos.length > 0 && (
                            <div className="resource-section">
                                <h3>🎥 Videos</h3>
                                <ul>
                                    {selectedLesson.videos.map((video, idx) => (
                                        <li key={idx}>
                                            <a href={video.url} target="_blank" rel="noopener noreferrer">
                                                {video.title || `Video ${idx + 1}`}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedLesson.exercices && selectedLesson.exercices.length > 0 && (
                            <div className="resource-section">
                                <h3>✏️ Exercises</h3>
                                <ul>
                                    {selectedLesson.exercices.map((exercise, idx) => (
                                        <li key={idx}>
                                            <a href={exercise.url} target="_blank" rel="noopener noreferrer">
                                                {exercise.title || `Exercise ${idx + 1}`}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Lessons;
