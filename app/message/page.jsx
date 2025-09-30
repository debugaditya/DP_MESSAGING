'use client';
import './style.css'
import { useRouter } from 'next/navigation';
import socketService from '../socket';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';

import Sidebar from '@/app/sidebar/page';
import Searchbar2 from '@/app/searchbar2/page';

export default function Page() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [chatList, setChatList] = useState([]);

    useEffect(() => {
        const storedUsername = window.sessionStorage.getItem('dpusername');
        if (!storedUsername) {
            router.push('/');
        } else {
            setUser(storedUsername);
        }
    }, [router]);

    useEffect(() => {
        if (!user) return;

        socketService.connectSocket(user);

        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user }),
                });

                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await res.json();
                const messageMap = data.mp || {};
                const freqMap = data.cnt || {};

                const usernames = Object.keys(messageMap);
                if (usernames.length === 0) {
                    setIsLoading(false);
                    return;
                }
                
                const profilePromises = usernames.map(username =>
                    fetch(`/api/fetchprofile`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username }),
                    }).then(res => res.json())
                );

                const profiles = await Promise.all(profilePromises);

                const combinedData = profiles.map((profile, index) => {
                    const username = usernames[index];
                    return {
                        username: username,
                        name: profile.NAME || username,
                        photo: profile.PHOTO,
                        lastMessage: messageMap[username]?.message,
                        timestamp: messageMap[username]?.timestamp,
                        count: freqMap[username] || 0,
                    };
                });
                
                combinedData.sort((a, b) => b.timestamp - a.timestamp);
                setChatList(combinedData);

            } catch (err) {
                console.error("Error fetching messages:", err);
                setError("Failed to load messages.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();

        return () => {
            socketService.disconnectSocket();
        };
    }, [user]);

    useEffect(() => {
        if (!socketService || !user) return;

        const handleReceiveMessage = (data) => {
            const { from, content } = data;
            
            setChatList(prevList => {
                const existingUserIndex = prevList.findIndex(item => item.username === from);
                let newList = [...prevList];

                const updateUserProfile = async () => {
                    if (existingUserIndex !== -1) {
                        const updatedUser = {
                            ...newList[existingUserIndex],
                            lastMessage: content,
                            timestamp: Date.now(),
                            count: (newList[existingUserIndex].count || 0) + 1,
                        };
                        newList.splice(existingUserIndex, 1);
                        newList.unshift(updatedUser);
                    } else {
                        try {
                            const res = await fetch(`/api/fetchprofile`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: from }),
                            });
                            const profile = await res.json();
                            const newUser = {
                                username: from,
                                name: profile.NAME || from,
                                photo: profile.PHOTO,
                                lastMessage: content,
                                timestamp: Date.now(),
                                count: 1,
                            };
                            newList.unshift(newUser);
                        } catch (e) {
                            console.error("Failed to fetch profile for new message:", e);
                            const newUser = {
                                username: from, name: from, photo: null, lastMessage: content, timestamp: Date.now(), count: 1,
                            };
                            newList.unshift(newUser);
                        }
                    }
                    return newList;
                };

                updateUserProfile().then(updatedList => setChatList(updatedList));
                
                return prevList; 
            });
        };

        socketService.onMessageReceive(handleReceiveMessage);

        return () => {
            socketService.offMessageReceive();
        };
    }, [user]);


    return (
        <div className="message-page">
            <Sidebar />
            
            <div className="message-content">
                {isLoading ? (
                    <p>Loading messages...</p>
                ) : error ? (
                    <p className="error">{error}</p>
                ) : (
                    <ul className="message-list">
                        <Searchbar2 />
                        {chatList.length > 0 ? chatList.map(chat => (
                            <li key={chat.username} className="message-item" onClick={() => router.push(`/chatbox/${chat.username}`)}>
                                <img src={chat.photo || 'https://res.cloudinary.com/dr83ajyus/image/upload/v1752303058/r1esmv4w44ezrxqhfuto.jpg'} alt={`${chat.name}'s profile`} className="profile-pic" />
                                <div className="message-info">
                                    <h2>{chat.name}</h2>
                                    <p>{chat.lastMessage ? chat.lastMessage.substring(0, 35) + (chat.lastMessage.length > 35 ? '...' : '') : 'No messages yet'}</p>
                                </div>
                                {chat.count > 0 && (
                                    <div className="message-count-wrapper">
                                        <span className="message-count">{chat.count}</span>
                                    </div>
                                )}
                            </li>
                        )) : <p>No conversations found.</p>}
                    </ul>
                )}
            </div>
        </div>
    );
}
