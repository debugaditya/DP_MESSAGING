'use client';
import './style.css';
import { useRouter } from 'next/navigation';
import socketService from '../socket';
import { useState } from 'react';

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();
    setIsLoading(true);

    let username = document.querySelector('input[type="text"]').value.trim();
    let password = document.querySelector('input[type="password"]').value.trim();

    if (!username || !password) {
      alert('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        window.sessionStorage.setItem('dpusername', username);
        socketService.connectSocket(username);
        router.push('/editprofile');
      } else {
        alert('User already exists');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred during sign-up.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Create Account</h1>
      <input type="text" placeholder="Username" disabled={isLoading} />
      <input type="password" placeholder="Password" disabled={isLoading} />
      <button type="submit" onClick={handleSignup} disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="spinner"></div>
            Creating Account...
          </>
        ) : (
          'Sign Up'
        )}
      </button>
      <p className="signin-link">
        Already have an account?{' '}
        <a href="#" onClick={() => router.push('/')}>
          Sign in here
        </a>
      </p>
    </div>
  );
}