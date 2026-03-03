import { useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import './YouTubeConverter.css';

function YouTubeConverter() {
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState(null);
    const [log, setLog] = useState([]);

    const addLog = (message, type = 'info') => {
        setLog(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
    };

    const convertEmbedToWatch = (url) => {
        if (!url || typeof url !== 'string') return url;

        // Check if it's a YouTube embed link
        if (url.includes('youtube.com/embed/')) {
            // Extract video ID from embed URL
            const videoId = url.split('/embed/')[1]?.split('?')[0];
            if (videoId) {
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
        }

        return url;
    };

    const convertLinksInItem = (item) => {
        let converted = 0;
        const updatedItem = { ...item };

        // Arrays that might contain YouTube links
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
        addLog('🚀 Starting YouTube link conversion...', 'info');

        const stats = {
            lessonsChecked: 0,
            examsChecked: 0,
            linksConverted: 0,
            documentsUpdated: 0,
            errors: 0
        };

        try {
            // Process Lessons
            addLog('📚 Processing lessons collection...', 'info');
            const lessonsRef = collection(db, 'lessons');
            const lessonsSnapshot = await getDocs(lessonsRef);

            setProgress({ current: 0, total: lessonsSnapshot.size });
            stats.lessonsChecked = lessonsSnapshot.size;

            let batch = writeBatch(db);
            let batchCount = 0;
            let processed = 0;

            for (const docSnapshot of lessonsSnapshot.docs) {
                const data = docSnapshot.data();
                const { updatedItem, converted } = convertLinksInItem(data);

                if (converted > 0) {
                    batch.update(doc(db, 'lessons', docSnapshot.id), updatedItem);
                    stats.linksConverted += converted;
                    stats.documentsUpdated++;
                    batchCount++;

                    addLog(`✅ Updated lesson "${data.title || docSnapshot.id}" - ${converted} links converted`, 'success');

                    // Commit batch every 500 docs
                    if (batchCount >= 500) {
                        await batch.commit();
                        addLog(`💾 Batch committed (${batchCount} documents)`, 'info');
                        batch = writeBatch(db);
                        batchCount = 0;
                    }
                }

                processed++;
                setProgress({ current: processed, total: lessonsSnapshot.size });
            }

            // Commit remaining batch
            if (batchCount > 0) {
                await batch.commit();
                addLog(`💾 Final batch committed (${batchCount} documents)`, 'info');
            }

            // Process Exams
            addLog('📋 Processing exams collection...', 'info');
            const examsRef = collection(db, 'exams');
            const examsSnapshot = await getDocs(examsRef);

            stats.examsChecked = examsSnapshot.size;
            batch = writeBatch(db);
            batchCount = 0;
            processed = 0;

            setProgress({ current: 0, total: examsSnapshot.size });

            for (const docSnapshot of examsSnapshot.docs) {
                const data = docSnapshot.data();
                const { updatedItem, converted } = convertLinksInItem(data);

                if (converted > 0) {
                    batch.update(doc(db, 'exams', docSnapshot.id), updatedItem);
                    stats.linksConverted += converted;
                    stats.documentsUpdated++;
                    batchCount++;

                    addLog(`✅ Updated exam "${data.title || docSnapshot.id}" - ${converted} links converted`, 'success');

                    if (batchCount >= 500) {
                        await batch.commit();
                        addLog(`💾 Batch committed (${batchCount} documents)`, 'info');
                        batch = writeBatch(db);
                        batchCount = 0;
                    }
                }

                processed++;
                setProgress({ current: processed, total: examsSnapshot.size });
            }

            if (batchCount > 0) {
                await batch.commit();
                addLog(`💾 Final batch committed (${batchCount} documents)`, 'info');
            }

            setResults(stats);
            addLog('🎉 Conversion complete!', 'success');

        } catch (error) {
            console.error('Error converting links:', error);
            stats.errors++;
            addLog(`❌ Error: ${error.message}`, 'error');
            setResults(stats);
        } finally {
            setConverting(false);
        }
    };

    return (
        <div className="youtube-converter">
            <div className="converter-header">
                <h1>🔗 YouTube Link Converter</h1>
                <p>Convert YouTube embed links to watch links in all lessons and exams</p>
            </div>

            <div className="converter-info">
                <h3>What does this do?</h3>
                <p>This tool will scan all lessons and exams in your Firebase database and convert any YouTube embed links from:</p>
                <div className="link-examples">
                    <div className="example-from">
                        ❌ <code>https://www.youtube.com/embed/VIDEO_ID</code>
                    </div>
                    <div className="example-arrow">→</div>
                    <div className="example-to">
                        ✅ <code>https://www.youtube.com/watch?v=VIDEO_ID</code>
                    </div>
                </div>
            </div>

            <div className="converter-actions">
                <button
                    className="convert-btn"
                    onClick={convertAllLinks}
                    disabled={converting}
                >
                    {converting ? '🔄 Converting...' : '🚀 Start Conversion'}
                </button>
            </div>

            {converting && progress.total > 0 && (
                <div className="progress-section">
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                    <p className="progress-text">
                        Processing: {progress.current} / {progress.total}
                    </p>
                </div>
            )}

            {results && (
                <div className="results-section">
                    <h2>📊 Conversion Results</h2>
                    <div className="results-grid">
                        <div className="result-card">
                            <div className="result-number">{results.lessonsChecked}</div>
                            <div className="result-label">Lessons Checked</div>
                        </div>
                        <div className="result-card">
                            <div className="result-number">{results.examsChecked}</div>
                            <div className="result-label">Exams Checked</div>
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
                    <h3>📝 Activity Log</h3>
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
