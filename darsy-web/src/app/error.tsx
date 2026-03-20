'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Something went wrong.</h2>
            <pre style={{ color: 'red', fontSize: '0.75rem', margin: '1rem 0' }}>{error.message}</pre>
            <button onClick={reset} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
                Try again
            </button>
        </div>
    );
}
