'use client';

import './style.css';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Searchbar2() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const res = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery }),
                });
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                const results = await res.json();
                setSearchResults(results);
            } catch (error) {
                console.error("Error fetching search results:", error);
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    return (
        <div className="search-section">
            <form onSubmit={(e) => e.preventDefault()}>
                <input
                    className="search-input"
                    type="text"
                    placeholder="Search for users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>

            {searchQuery.trim() && (
                <div className="search-results-container">
                    {isLoading ? (
                        <p className="search-status-message">Searching...</p>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((result) => (
                            <div key={result.USERNAME} className="search-result-card" onClick={() => router.push(`/chatbox/${result.USERNAME}`)}>
                                <img src={result.PHOTO || '/default-avatar.png'} alt={`${result.NAME || result.USERNAME}'s avatar`} />
                                <div className="result-info">
                                    <h3>{result.NAME || result.USERNAME}</h3>
                                    <p>@{result.USERNAME}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="search-status-message">No results found.</p>
                    )}
                </div>
            )}
        </div>
    );
}
