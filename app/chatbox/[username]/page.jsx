'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import socketService from '../../socket';
import './style.css';
import '../global.css';
import dynamic from 'next/dynamic';



export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [recipientUser, setRecipientUser] = useState(null);
    const [recipientProfile, setRecipientProfile] = useState({ name: '', photo: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const router = useRouter();
    const params = useParams();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const storedUsername = window.sessionStorage.getItem('dpusername');
        if (!storedUsername) {
            router.push('/');
        } else {
            setCurrentUser(storedUsername);
            setRecipientUser(params.username);
        }
    }, [router, params.username]);

    useEffect(() => {
        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        };
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!recipientUser || !currentUser) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const profileRes = await fetch(`/api/fetchprofile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: recipientUser }),
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setRecipientProfile({
                        name: profileData.NAME || recipientUser,
                        photo: profileData.PHOTO
                    });
                }

                const res = await fetch(`/api/chatbox`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin: currentUser, username: recipientUser }),
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch messages');
                }
                const data = await res.json();
                setMessages(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Could not load chat history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [recipientUser, currentUser]);

    useEffect(() => {
        if (!currentUser || !recipientUser) return;

        socketService.connectSocket(currentUser);
        socketService.sendNotification(currentUser, recipientUser, "seen");
        const markAsSeen = async () => {
            try {
                await fetch(`/api/seen`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin: currentUser, username: recipientUser })
                });
            } catch (error) {
                console.error('Error marking messages as seen:', error);
            }
        }
        markAsSeen();

        const handleMessageReceive = (incomingMessage) => {
            socketService.sendNotification(currentUser, recipientUser, "seen");
            if (incomingMessage.from === recipientUser && incomingMessage.to === currentUser) {
                const messageData = {
                    FROM: incomingMessage.from,
                    TEXT: incomingMessage.content,
                    SEEN: true,
                    TO: incomingMessage.to,
                    TIME: new Date().toISOString(),
                };
                setMessages((prevMessages) => [...prevMessages, messageData]);
                markAsSeen();
            }
        };

        const handleNotification = (notification) => {
            if (notification.type === 'seen' && notification.from === recipientUser) {
                
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.FROM === currentUser ? { ...msg, SEEN: true } : msg
                )
              );
            }

        };

        socketService.onMessageReceive(handleMessageReceive);
        socketService.onNotificationReceive(handleNotification);

        return () => {
            socketService.offMessageReceive(handleMessageReceive);
            socketService.offNotificationReceive(handleNotification);
        };
    }, [currentUser, recipientUser]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !recipientUser) {
            return;
        }

        const messageData = {
            FROM: currentUser,
            TEXT: newMessage,
            SEEN: false,
            TO: recipientUser,
            TIME: new Date().toISOString()
        };

        socketService.sendMessage(currentUser, recipientUser, newMessage);
        socketService.sendNotification(currentUser, recipientUser, "message");
        setMessages((prevMessages) => [...prevMessages, messageData]);
        setNewMessage('');
        
        try {
            await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: currentUser, receiver: recipientUser, message: newMessage })
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        }
    };

    if (!currentUser) {
        return null;
    }

    return (
        <>
            <div className="chat-container">
                <div className="chat-header" onClick={() => router.push(`/profile/${recipientUser}`)}>
                    <img 
                        src={recipientProfile.photo || "https://res.cloudinary.com/dr83ajyus/image/upload/v1752303058/r1esmv4w44ezrxqhfuto.jpg"} 
                        alt={`${recipientProfile.name}'s profile`} 
                        className="profile-photo" 
                    />
                    <h2>{recipientProfile.name}</h2>
                </div>
                <div className="messages-area">
                    {loading && <p>Loading messages...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {!loading && !error && messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.FROM === currentUser ? 'sent' : 'received'}`}
                        >
                            <p>{msg.TEXT}</p>
                            <div className="message-meta">
                                <span className="message-time">
                                    {new Date(msg.TIME).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.FROM === currentUser && (
                                    <span className={`seen-ticks ${msg.SEEN ? 'blue' : 'grey'}`}>
                                        <svg viewBox="0 0 18 18" height="18" width="18">
                                            <path
                                                fill="currentColor"
                                                d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198a.37.37 0 01-.52.063l-2.794-2.43a.434.434 0 00-.602.081l-.47 
                                                .533a.434.434 0 00.081.602l3.34 2.906a1.29 1.29 0 001.84-.234l7.036-9.026a.434.434 0 00-.075-.608zm-4.838 
                                                0l-.57-.444a.434.434 0 00-.609.076l-6.39 8.198a.37.37 0 01-.52.063l-2.794-2.43a.434.434 0 00-.602.081l-.47 
                                                .533a.434.434 0 00.081.602l3.34 2.906a1.29 1.29 0 001.84-.234l7.036-9.026a.434.434 0 00-.075-.608z"
                                            ></path>
                                        </svg>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form className="message-form" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        autoComplete="off"
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        </>
    );
}
