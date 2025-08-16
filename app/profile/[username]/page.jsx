'use client';
import './style.css';
import { useRouter } from 'next/navigation';
import socketService from '../../socket';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/app/sidebar/page';

export default function Page() {
    const params = useParams();
    const { username } = params;
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [photo, setPhoto] = useState("https://res.cloudinary.com/dr83ajyus/image/upload/v1752303058/r1esmv4w44ezrxqhfuto.jpg");
    const [state, setState] = useState('');
    const [admin, setAdmin] = useState('');
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const storedAdmin = window.sessionStorage.getItem('dpusername');
            if (storedAdmin) {
                setAdmin(storedAdmin);
                if (storedAdmin !== username) {
                    try {
                        const response = await fetch('/api/stalk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stalker: storedAdmin, stalked: username })
                        });
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    } catch (error) {
                        console.error('Error fetching stalker data:', error);
                    }

                }
            } else {
                router.push('/');
            }
        };

        fetchData();
    }, [router, username]);
    const handlereq = useCallback(async () => {
        let response;
        let data;

        try {
            if (state === 'You') return;

            else if (state === 'Friends') {
                response = await fetch(`/api/handle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username1: admin, username2: username, type: 'unfriend' })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                data = await response.json();
                if (data.status === '200') {
                    setState('Send request');
                    console.log(state);
                    setFriends(prevFriends => prevFriends.filter(f => f !== username));
                }
                return;
            }
            else if (state === 'Accept request') {
                response = await fetch(`/api/handle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username1: admin, username2: username, type: 'accept' })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                data = await response.json();
                if (data.status === '200') {
                    setState('Friends');
                    console.log(state);
                    setFriends(prevFriends => [...prevFriends, username]);
                }
                return;
            }
            else if (state === 'Requested') {
                response = await fetch(`/api/handle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username1: username, username2: admin, type: 'cancel' })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                data = await response.json();
                if (data.status === '200') {
                    setState('Send request');
                    console.log(state);
                }
                return;
            }
            else if (state === 'Send request') {
                response = await fetch(`/api/handle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username1: admin, username2: username, type: 'send' })
                });
                data = await response.json();
                if (data.status === '200') {
                    setState('Requested');
                    if (socketService && socketService.emit) {
                        socketService.emit('friendRequestSent', { from: admin, to: username });
                    } else {
                        console.warn('Socket service or emit method not available.');
                    }
                }
                return
            } else {
                console.error(`Unknown state: ${state}`);
                return;
            }
        } catch (error) {
            console.error('Error in handlereq:', error);
            alert(`An error occurred: ${error.message}`);
        }
    }, [admin, username, state, router]);

    useEffect(() => {
        if (!admin || !username) {
            setIsLoading(true);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const profileResponse = await fetch(`/api/fetchprofile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username })
                });

                if (!profileResponse.ok) throw new Error(`HTTP error! status: ${profileResponse.status}`);
                const profileData = await profileResponse.json();

                setName(profileData.NAME);
                setBio(profileData.BIO);
                setPhoto(profileData.PHOTO || "https://res.cloudinary.com/dr83ajyus/image/upload/v1752303058/r1esmv4w44ezrxqhfuto.jpg");
                setFriends(profileData.FRIENDS);

                let determinedState = 'Send request';

                if (admin === username) {
                    determinedState = 'You';
                } else if (profileData.FRIENDS && Array.isArray(profileData.FRIENDS) && profileData.FRIENDS.includes(admin)) {
                    determinedState = 'Friends';
                } else {
                    const relationResponse = await fetch('/api/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username1: username, username2: admin })
                    });


                    if (!relationResponse.ok) throw new Error(`HTTP error! status: ${relationResponse.status}`);
                    const relationResult = await relationResponse.json();

                    if (relationResult.status === '200') {
                        determinedState = 'Accept request';
                    } else if (relationResult.status === '201') {
                        determinedState = 'Requested';
                    }
                }
                setState(determinedState);

            } catch (error) {
                console.error('Error fetching user profile or relationship status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [username, admin]);

    if (isLoading || admin === null) {
        return (
            <div className="container">
                <div className="spinner"></div>
                <p>Loading user session...</p>
            </div>
        );
    }

    return (
        <>
            <Sidebar />
            <div>
                <div className="profile-container">
                    <img src={photo} alt={`${name}'s profile`} />
                    <h1>{name}</h1>
                    <p>{bio}</p>
                    <span className="friends-count">Friends: {friends.length}</span>

                    <div className="profile-buttons">
                        {state === 'You' ? (
                            <button onClick={() => router.push('/editprofile')}>Edit Profile</button>
                        ) : (
                            <button onClick={() => router.push(`/chatbox/${username}`)}>Message</button>
                        )}
                        <button onClick={handlereq}>{state}</button>
                    </div>
                </div>
            </div>
        </>
    );
}
