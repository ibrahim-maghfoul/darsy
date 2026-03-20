import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        if (!result.success) setError(result.error);
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f7f6 0%, #e8f5ee 50%, #f0f5f2 100%)',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'absolute', top: '-20%', right: '-10%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(58,170,106,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-15%', left: '-5%',
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(58,170,106,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div className="animate-scale" style={{
                width: '100%', maxWidth: 420,
                background: 'white',
                borderRadius: 28,
                padding: '3rem 2.5rem',
                boxShadow: '0 20px 60px rgba(26,46,53,0.08), 0 1px 3px rgba(26,46,53,0.04)',
                border: '1px solid #e4ece8',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 56, height: 56,
                        borderRadius: 18,
                        background: 'linear-gradient(135deg, #3aaa6a, #2d8a55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 8px 24px rgba(58,170,106,0.25)',
                    }}>
                        <span style={{ color: 'white', fontWeight: 900, fontSize: 22, fontStyle: 'italic' }}>D</span>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a2e35', margin: 0 }}>
                        Darsy Admin
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: '#5f7d8a', marginTop: 6 }}>
                        Sign in to manage your platform
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Email */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1a2e35', marginBottom: 6 }}>
                            Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#5f7d8a' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@darsy.com"
                                required
                                className="input"
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#1a2e35', marginBottom: 6 }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#5f7d8a' }} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                className="input"
                                style={{ paddingLeft: 40, paddingRight: 40 }}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{
                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: '#5f7d8a', cursor: 'pointer', padding: 4,
                                }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="animate-fade" style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', borderRadius: 12,
                            background: '#fee2e2', color: '#991b1b', fontSize: '0.8rem', fontWeight: 500,
                        }}>
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{
                        width: '100%', justifyContent: 'center',
                        padding: '12px 20px', fontSize: '0.9rem', fontWeight: 700,
                        borderRadius: 14, marginTop: 4,
                        opacity: loading ? 0.7 : 1,
                    }}>
                        {loading ? <><Loader2 size={16} className="spin" /> Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#5f7d8a', marginTop: '1.5rem' }}>
                    Only administrators can access this panel
                </p>
            </div>
        </div>
    );
};

export default Login;
