'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import socketService from '../../socket';
import './style.css';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('@/app/sidebar/page'), { ssr: false });

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
        if (!currentUser) return;

        socketService.connectSocket(currentUser);
        const seen= async () => {
            try {
                await fetch(`/api/seen`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin: currentUser, username: recipientUser })
                });
            }
            catch (error) {
                console.error('Error marking messages as seen:', error);
            }
          }
          seen();

        const handleMessageReceive = (incomingMessage) => {
            if (
                (incomingMessage.from === recipientUser && incomingMessage.to === currentUser)
            ) {
                 const messageData = {
                    FROM: incomingMessage.from,
                    MESSAGE: incomingMessage.content,
                    TIME: new Date().toISOString()
                };
                setMessages((prevMessages) => [...prevMessages, messageData]);
            }
        };

        socketService.onMessageReceive(handleMessageReceive);

        return () => {
            socketService.offMessageReceive(handleMessageReceive);
        };
    }, [currentUser, recipientUser]);

    const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser || !recipientUser) {
      return;
    }

    // Corrected message object structure
    const messageData = {
      FROM: currentUser,
      MESSAGE: newMessage, // Changed from 'content' to 'MESSAGE'
      TIME: new Date().toISOString()
    };
    
    socketService.sendMessage(currentUser, recipientUser, newMessage);
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setNewMessage('');
  };

    if (!currentUser) {
        return null;
    }

    return (
        <>
            <Sidebar />
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
