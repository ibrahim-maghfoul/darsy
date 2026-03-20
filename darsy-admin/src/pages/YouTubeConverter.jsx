import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './YouTubeConverter.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function YouTubeConverter() {
    const { token } = useAuth();
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState(null);
    const [log, setLog] = useState([]);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const addLog = (message, type = 'info') => {
        setLog(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
    };

    const convertEmbedToWatch = (url) => {
        if (!url || typeof url !== 'string') return url;
        if (url.includes('youtube.com/embed/')) {
            const videoId = url.split('/embed/')[1]?.split('?')[0];
            if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
        }
        return url;
    };

    const convertLinksInItem = (item) => {
        let converted = 0;
        const updatedItem = { ...item };
        const arrayFields = ['videos', 'coursesPdf', 'examPdfs', 'exercices', 'resourses'];

        for (const field of arrayFields) {
            if (Array.isArray(updatedItem[field])) {
                updatedItem[field] = updatedItem[field].map(resource => {
                    if (resource.url) {
                        const newUrl = convertEmbedToWatch(resource.url);
                        if (newUrl !== resource.url) {
                            converted++;
                            return { ...resource, url: newUrl };
                        }
                    }
                    return resource;
                });
            }
        }

        return { updatedItem, converted };
    };

    const convertAllLinks = async () => {
        setConverting(true);
        setResults(null);
        setLog([]);
        addLog('Starting YouTube link conversion...', 'info');

        const stats = { lessonsChecked: 0, linksConverted: 0, documentsUpdated: 0, errors: 0 };

        try {
            // Fetch all schools -> levels -> guidances -> subjects -> lessons from MongoDB
            addLog('Fetching schools from MongoDB...', 'info');
            const schoolsRes = await fetch(`${API}/data/schools`, { headers });
            const schools = await schoolsRes.json();

            let allLessons = [];

            for (const school of schools) {
                const levelsRes = await fetch(`${API}/data/levels/${school._id}`, { headers });
                const levels = await levelsRes.json();

                for (const level of levels) {
                    const guidancesRes = await fetch(`${API}/data/guidances/${level._id}`, { headers });
                    const guidances = await guidancesRes.json();

                    for (const guidance of guidances) {
                        const subjectsRes = await fetch(`${API}/data/subjects/${guidance._id}`, { headers });
                        const subs = await subjectsRes.json();

                        for (const sub of subs) {
                            const lessonsRes = await fetch(`${API}/data/lessons/${sub._id}`, { headers });
                            const lessons = await lessonsRes.json();
                            if (Array.isArray(lessons)) allLessons.push(...lessons);
                        }
                    }
                }
            }

            addLog(`Found ${allLessons.length} lessons. Scanning for embed links...`, 'info');
            stats.lessonsChecked = allLessons.length;
            setProgress({ current: 0, total: allLessons.length });

            let processed = 0;
            for (const lesson of allLessons) {
                const { updatedItem, converted } = convertLinksInItem(lesson);

                if (converted > 0) {
                    try {
                        await fetch(`${API}/data/lessons/${lesson._id}`, {
                            method: 'PUT',
                            headers,
                            body: JSON.stringify(updatedItem),
                        });
                        stats.linksConverted += converted;
                        stats.documentsUpdated++;
                        addLog(`Updated "${lesson.title || lesson._id}" - ${converted} links converted`, 'success');
                    } catch (err) {
                        stats.errors++;
                        addLog(`Failed to update "${lesson.title}": ${err.message}`, 'error');
                    }
                }

                processed++;
                setProgress({ current: processed, total: allLessons.length });
            }

            setResults(stats);
            addLog('Conversion complete!', 'success');
        } catch (error) {
            console.error('Error converting links:', error);
            stats.errors++;
            addLog(`Error: ${error.message}`, 'error');
            setResults(stats);
        } finally {
            setConverting(false);
        }
    };

    return (
        <div className="youtube-converter">
            <div className="converter-header">
                <h1>YouTube Link Converter</h1>
                <p>Convert YouTube embed links to watch links in all lessons (MongoDB)</p>
            </div>

            <div className="converter-info">
                <h3>What does this do?</h3>
                <p>This tool will scan all lessons in MongoDB and convert any YouTube embed links from:</p>
                <div className="link-examples">
                    <div className="example-from">
                        <code>https://www.youtube.com/embed/VIDEO_ID</code>
                    </div>
                    <div className="example-arrow">&rarr;</div>
                    <div className="example-to">
                        <code>https://www.youtube.com/watch?v=VIDEO_ID</code>
                    </div>
                </div>
            </div>

            <div className="converter-actions">
                <button className="convert-btn" onClick={convertAllLinks} disabled={converting}>
                    {converting ? 'Converting...' : 'Start Conversion'}
                </button>
            </div>

            {converting && progress.total > 0 && (
                <div className="progress-section">
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                    </div>
                    <p className="progress-text">Processing: {progress.current} / {progress.total}</p>
                </div>
            )}

            {results && (
                <div className="results-section">
                    <h2>Conversion Results</h2>
                    <div className="results-grid">
                        <div className="result-card">
                            <div className="result-number">{results.lessonsChecked}</div>
                            <div className="result-label">Lessons Checked</div>
                        </div>
                        <div className="result-card success">
                            <div className="result-number">{results.linksConverted}</div>
                            <div className="result-label">Links Converted</div>
                        </div>
                        <div className="result-card success">
                            <div className="result-number">{results.documentsUpdated}</div>
                            <div className="result-label">Documents Updated</div>
                        </div>
                        {results.errors > 0 && (
                            <div className="result-card error">
                                <div className="result-number">{results.errors}</div>
                                <div className="result-label">Errors</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {log.length > 0 && (
                <div className="log-section">
                    <h3>Activity Log</h3>
                    <div className="log-container">
                        {log.map((entry, idx) => (
                            <div key={idx} className={`log-entry log-${entry.type}`}>
                                <span className="log-time">[{entry.time}]</span>
                                <span className="log-message">{entry.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default YouTubeConverter;
