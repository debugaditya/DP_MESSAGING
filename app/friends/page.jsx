'use client';
import './style.css';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '@/app/sidebar/page';
import Searchbar from '@/app/searchbar/page';

export default function Page() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [friendsList, setFriendsList] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [stalkers, setStalkers] = useState([]);
    const [admin, setAdmin] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const storedAdmin = window.sessionStorage.getItem('dpusername');
        if (storedAdmin) {
            setAdmin(storedAdmin);
        } else {
            router.push('/');
        }
    }, [isMounted, router]);

    useEffect(() => {
        if (!admin || !isMounted) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch friends
                const friendsResponse = await fetch('/api/fetchprofile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: admin }) });
                if (!friendsResponse.ok) throw new Error('Failed to fetch friends');
                const friendsData = await friendsResponse.json();
                const detailedFriendsPromises = (friendsData.FRIENDS || []).map(async (friendUsername) => {
                    const res = await fetch('/api/fetchprofile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: friendUsername }) });
                    return res.ok ? res.json() : null;
                });
                setFriendsList((await Promise.all(detailedFriendsPromises)).filter(Boolean));

                // Fetch friend requests
                const requestsResponse = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: admin, type: 'request' }) });
                if (!requestsResponse.ok) throw new Error('Failed to fetch requests');
                const requestsData = await requestsResponse.json();
                const detailedRequestsPromises = (requestsData.friends || []).map(async (reqUsername) => {
                    const res = await fetch('/api/fetchprofile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: reqUsername.FROM }) });
                    return res.ok ? res.json() : null;
                });
                setFriendRequests((await Promise.all(detailedRequestsPromises)).filter(Boolean));

                // Fetch stalkers
                const stalkersResponse = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: admin, type: 'stalkers' }) });
                if (!stalkersResponse.ok) throw new Error('Failed to fetch stalkers');
                const stalkersData = await stalkersResponse.json();
                if (stalkersData.status === '200') {
                    const detailedStalkersPromises = (stalkersData.friends || []).map(async (stalkerInfo) => {
                        const res = await fetch('/api/fetchprofile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: stalkerInfo.STALKER }) });
                        if (res.ok) {
                            const stalkerProfile = await res.json();
                            return { ...stalkerProfile, FREQUENCY: stalkerInfo.FREQUENCY };
                        }
                        return null;
                    });
                    setStalkers((await Promise.all(detailedStalkersPromises)).filter(Boolean));
                } else {
                    setStalkers([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [admin, isMounted]);

    const handleUnfriend = async (e, friendUsername) => { e.stopPropagation(); /* ... logic ... */ };
    const handleAcceptRequest = async (e, requestUsername) => { e.stopPropagation(); /* ... logic ... */ };
    const handleRejectRequest = async (e, requestUsername) => { e.stopPropagation(); /* ... logic ... */ };

    if (!isMounted) {
        return (
            <div className="page-wrapper">
                <Sidebar />
                <div className="page-container">
                    <div className="loading-main">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <Sidebar />
            <main className="page-container">
                <Searchbar />
                <div className="main-content">
                    {isLoading ? (
                        <div className="loading-main">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            <div className="friends-list">
                                <h2>Friends ({friendsList.length})</h2>
                                {friendsList.length > 0 ? (
                                    friendsList.map((friend) => (
                                        <div className="friend-card" key={friend.USERNAME} onClick={() => router.push(`/profile/${friend.USERNAME}`)}>
                                            <img src={friend.PHOTO || "https://res.cloudinary.com/dr83ajyus/image/upload/v1752303058/r1esmv4w44ezrxqhfuto.jpg"} alt={friend.NAME || friend.USERNAME} />
                                            <div className="friend-info">
                                                <h3>{friend.NAME}</h3>
                                                <p>{friend.BIO || 'No bio available'}</p>
                                            </div>
                                            <button onClick={(e) => handleUnfriend(e, friend.USERNAME)}>Unfriend</button>
                                        </div>
                                    ))
                                ) : ( <p className="no-data-message">You don't have any friends yet.</p> )}
                            </div>

                            <div className="friend-reqs">
                                <h2>Friend Requests ({friendRequests.length})</h2>
                                {friendRequests.length > 0 ? (
                                    friendRequests.map((request) => (
                                        <div className="friend-request-card" key={request.USERNAME} onClick={() => router.push(`/profile/${request.USERNAME}`)}>
                                            <img src={request.PHOTO || "https://res.cloudinary.com/dr83ajyus/image/upload/v1752303058/r1esmv4w44ezrxqhfuto.jpg"} alt={request.NAME || request.USERNAME} />
                                            <div className="friend-info">
                                                <h3>{request.NAME || request.USERNAME}</h3>
                                                <p>{request.BIO || 'No bio available'}</p>
                                            </div>
                                            <button className="accept-btn" onClick={(e) => handleAcceptRequest(e, request.USERNAME)}>Accept</button>
                                            <button className="reject-btn" onClick={(e) => handleRejectRequest(e, request.USERNAME)}>Reject</button>
                                        </div>
                                    ))
                                ) : ( <p className="no-data-message">No pending friend requests.</p> )}
                            </div>

                            <div className="stalkers">
                                <h2>Stalkers ({stalkers.length})</h2>
                                {stalkers.length > 0 ? (
                                    stalkers.map((stalker) => (
                                        <div className="stalker-card" key={stalker.USERNAME} onClick={() => router.push(`/profile/${stalker.USERNAME}`)}>
                                            <img src={stalker.PHOTO || "https://res.cloudinary.com/dr83ajyus/image/upload/v1752303058/r1esmv4w44ezrxqhfuto.jpg"} alt={stalker.NAME || stalker.USERNAME} />
                                            <div className="stalker-info">
                                                <h3>{stalker.NAME || stalker.USERNAME}</h3>
                                                <p>{stalker.BIO || 'No bio available'}</p>
                                                <span className="frequency">Visits: {stalker.FREQUENCY || 0}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : ( <p className="no-data-message">No one is stalking you.</p> )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
