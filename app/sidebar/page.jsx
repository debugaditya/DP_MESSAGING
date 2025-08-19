'use client';

import './style.css';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MessageCircle, Users, User as UserIcon } from 'lucide-react';
import socketService from '../socket';

export default function Sidebar() {
  const router = useRouter();
  const [messages, setMessages] = useState(0);
  const [requests, setRequests] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // This state is no longer used for rendering
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUsername = window.sessionStorage.getItem('dpusername');
    if (!storedUsername) {
      router.push('/');
      return;
    }
    setUser(storedUsername);
  }, [router]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCounts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/sidebar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setMessages(data.messages || 0);
        setRequests(data.requests || 0);
      } catch (err) {
        console.error("Failed to fetch sidebar counts:", err);
        setError("Failed to load counts.");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    socketService.connectSocket(user);

    const handleNotification = (notification) => {
      if (notification.type === 'message') {
        setMessages((prev) => prev + 1);
      } else if (notification.type === 'friend-request') {
        setRequests((prev) => prev + 1);
      }
    };

    socketService.onNotificationReceive(handleNotification);

    return () => {
      socketService.offNotificationReceive(handleNotification);
    };
  }, [user]);

  async function handlesignout() {
    window.sessionStorage.removeItem('dpusername');
    socketService.disconnectSocket();
    router.push('/');
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavLinkClick = (path) => {
    router.push(path);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const showHamburgerNotificationDot = (messages > 0 || requests > 0) && !isSidebarOpen;

  if (!user) {
    return null;
  }
  
  // The 'if (loading)' block that was here has been removed.

  if (error) {
    return (
      <>
        <div className="hamburger-menu" onClick={toggleSidebar}>
          <div className="hamburger-icon"></div>
          <div className="hamburger-icon"></div>
          <div className="hamburger-icon"></div>
          {showHamburgerNotificationDot && <div className="notification-dot"></div>}
        </div>
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'hidden'}`}>
          <ul>
            <li>Error: {error}</li>
            <li onClick={handlesignout}>Sign out</li>
          </ul>
        </aside>
        <div className={`overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={toggleSidebar}></div>
      </>
    );
  }

  return (
    <>
      <div className="hamburger-menu" onClick={toggleSidebar}>
        <div className="hamburger-icon"></div>
        <div className="hamburger-icon"></div>
        <div className="hamburger-icon"></div>
        {showHamburgerNotificationDot && <div className="notification-dot"></div>}
      </div>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'hidden'}`}>
        <ul>
          <li onClick={() => handleNavLinkClick('/profile/' + (user || ''))}>
            <UserIcon size={22} /> Your Profile
          </li>
          <li onClick={() => handleNavLinkClick('/message')}>
            <MessageCircle size={22} /> Messages
            {messages > 0 && (
              <span className="badge">
                {messages}
              </span>
            )}
          </li>
          <li onClick={() => handleNavLinkClick('/friends')}>
            <Users size={22} /> Find Friends
            {requests > 0 && (
              <span className="badge">
                {requests}
              </span>
            )}
          </li>
          <li onClick={handlesignout}>Sign out</li>
        </ul>
      </aside>

      <div className={`overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={toggleSidebar}></div>
    </>
  );
}
