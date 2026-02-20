'use client';

import { useState } from 'react';

export default function Home() {
    const [npi, setNpi] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    async function handleLookup(e) {
        e.preventDefault();
        setError('');
        setResult(null);
        setLoading(true);

        try {
            const res = await fetch('/api/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ npi: npi.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Something went wrong.');
            } else {
                setResult(data);
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const doc = result?.npi;
    const li = result?.linkedin;

    return (
        <main className="container">
            {/* Header */}
            <div className="header">
                <div className="logo-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                </div>
                <h1>NPI Physician Lookup</h1>
                <p className="subtitle">Enter an NPI number to get a physician profile enriched with LinkedIn data</p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleLookup} className="search-form">
                <div className="input-group">
                    <input
                        type="text"
                        value={npi}
                        onChange={(e) => setNpi(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter 10-digit NPI number"
                        className="npi-input"
                        maxLength={10}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="lookup-btn"
                        disabled={loading || npi.length !== 10}
                    >
                        {loading ? (
                            <span className="spinner" />
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                Lookup
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Error */}
            {error && (
                <div className="error-card">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Results */}
            {doc && (
                <div className="profile-card fade-in">
                    {/* Top section with photo + basic info */}
                    <div className="profile-header">
                        {li?.image && (
                            <div className="avatar-wrapper">
                                <img src={li.image} alt={doc.firstName} className="avatar" />
                            </div>
                        )}
                        <div className="profile-basic">
                            <h2 className="doctor-name">
                                {doc.namePrefix} {doc.firstName} {doc.lastName}{doc.credential ? `, ${doc.credential}` : ''}
                            </h2>
                            <div className="specialty-badge">{doc.specialty}</div>
                            {li?.headline && (
                                <p className="headline">{li.headline}</p>
                            )}
                            <div className="meta-row">
                                <span className="meta-tag">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {doc.practiceAddress.city}, {doc.practiceAddress.state}
                                </span>
                                <span className="meta-tag">
                                    NPI: {doc.npiNumber}
                                </span>
                                <span className={`status-tag ${doc.status === 'Active' ? 'active' : 'inactive'}`}>
                                    {doc.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="info-grid">
                        {/* NPI Details */}
                        <div className="info-section">
                            <h3 className="section-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                NPI Details
                            </h3>
                            <div className="detail-list">
                                <div className="detail-row">
                                    <span className="label">Practice Address</span>
                                    <span className="value">{doc.practiceAddress.address}, {doc.practiceAddress.city}, {doc.practiceAddress.state} {doc.practiceAddress.zip}</span>
                                </div>
                                {doc.practiceAddress.phone && (
                                    <div className="detail-row">
                                        <span className="label">Phone</span>
                                        <span className="value">{doc.practiceAddress.phone}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="label">Specialties</span>
                                    <span className="value">{doc.allSpecialties.join(' · ')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Enumeration Date</span>
                                    <span className="value">{doc.enumerationDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* LinkedIn Work History */}
                        {li?.workHistory?.length > 0 && (
                            <div className="info-section">
                                <h3 className="section-title">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
                                    Work History
                                </h3>
                                <div className="timeline">
                                    {li.workHistory.map((w, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className="timeline-dot" />
                                            <div className="timeline-content">
                                                <strong>{w.title}</strong>
                                                <span className="company">{w.company}</span>
                                                <span className="dates">{formatDate(w.from)} — {w.to === 'Present' ? 'Present' : formatDate(w.to)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {li?.educationHistory?.length > 0 && (
                            <div className="info-section">
                                <h3 className="section-title">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" /></svg>
                                    Education &amp; Residency
                                </h3>
                                <div className="timeline">
                                    {li.educationHistory.map((e, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className="timeline-dot edu" />
                                            <div className="timeline-content">
                                                <strong>{e.degree}</strong>
                                                <span className="company">{e.institution}</span>
                                                {e.from && <span className="dates">{formatDate(e.from)} — {formatDate(e.to)}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LinkedIn Link */}
                    {li?.linkedinUrl && (
                        <a href={li.linkedinUrl} target="_blank" rel="noopener noreferrer" className="linkedin-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            View LinkedIn Profile
                        </a>
                    )}

                    {/* Exa cost */}
                    {li?.costDollars != null && (
                        <p className="exa-cost">Exa.ai lookup cost: ${li.costDollars.toFixed(4)}</p>
                    )}
                </div>
            )}

            {/* Footer */}
            <footer className="footer">
                <p>Data from <a href="https://npiregistry.cms.hhs.gov/" target="_blank" rel="noopener noreferrer">NPPES NPI Registry</a> &amp; <a href="https://exa.ai" target="_blank" rel="noopener noreferrer">Exa.ai</a></p>
            </footer>
        </main>
    );
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
        return dateStr;
    }
}
