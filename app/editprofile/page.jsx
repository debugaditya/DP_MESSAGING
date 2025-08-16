'use client';

import './style.css';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Page() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true); // Set to true initially for loading user from session
    const [loggedInUsername, setLoggedInUsername] = useState(null); // State to store the username after retrieving from session
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [profilePic, setProfilePic] = useState('');
    const [friends, setFriends] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null); // State for the file input

    // Effect to retrieve username from sessionStorage and handle redirection
    useEffect(() => {
        let userFromSession = null;
        if (typeof window !== 'undefined') { // Defensive check, though 'use client' helps
            const storedUsernameString = window.sessionStorage.getItem('dpusername');
            if (storedUsernameString) {
                try {
                    userFromSession = storedUsernameString;
                    setLoggedInUsername(userFromSession);
                    console.log('DEBUG: User from sessionStorage:', userFromSession);
                } catch (e) {
                    console.error("Error parsing stored username from sessionStorage:", e);
                    // Optionally redirect or handle error if session storage is corrupted
                }
            }
        }

        if (!userFromSession) {
            // Only redirect if userFromSession is definitively not found after checking sessionStorage
            // This ensures we wait for sessionStorage to be read before redirecting
            router.push('/');
        } else {
            // If user is found, proceed to fetch profile data
            fetchProfileData(userFromSession);
        }
    }, []); // Empty dependency array means this runs once on client mount

    // Function to fetch profile data, separated for clarity and reusability
    const fetchProfileData = async (username) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/fetchprofile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username }),
            });
            const userData = await res.json();
            // Assuming your API returns data like { NAME, BIO, PHOTO, FRIENDS }
            setName(userData.NAME || ''); // Provide default empty string if null/undefined
            setBio(userData.BIO || '');
            setProfilePic(userData.PHOTO || '');
            setFriends(userData.FRIENDS || null);
        } catch (error) {
            console.error("Error fetching profile:", error);
            // Consider displaying an error message to the user
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            // Optional: display a preview of the selected image
            // setProfilePic(URL.createObjectURL(event.target.files[0]));
        } else {
            setSelectedFile(null);
        }
    };

    const handleEdit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        // Get values from state, not direct DOM queries
        // Use 'loggedInUsername' which is guaranteed to be set if we reached this point
        const currentName = document.getElementById('name-input').value.trim(); // Get current value from input
        const currentBio = document.getElementById('bio-input').value.trim(); // Get current value from input

        if (!currentName || !currentBio) {
            alert('Please fill in all fields (Name and Bio).');
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('name', currentName);
        formData.append('bio', currentBio);
        formData.append('username', loggedInUsername); // Use the state variable for username

        if (selectedFile) {
            formData.append('photo', selectedFile); // Append 'photo' as the key for your server-side
        } else {
            // Optional: If you want to explicitly tell the server to remove the photo
            // or if no new photo is selected but a previous one existed, you might send a flag.
            // For now, if no file is selected, the 'photo' field just won't be in FormData.
            // Your server code handles `photoFile ? ... : undefined` which is good.
        }

        try {
            const res = await fetch('/api/editprofile', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                // If the profile picture was updated, update the state to reflect the new URL
                if (data.photoUrl) {
                    setProfilePic(data.photoUrl);
                }
                router.push(`/profile/${loggedInUsername}`);
            } else {
                const errorData = await res.json();
                alert(`Profile update failed: ${errorData.message || 'Unknown error'}`);
                console.error("Error updating profile:", errorData.message);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert('An error occurred during profile update.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- IMPORTANT: Return null or a loading spinner if username isn't available yet ---
    if (!loggedInUsername && isLoading) {
        return (
            <div className="container">
                <div className="spinner"></div>
                <p>Loading user session...</p>
            </div>
        );
    }

    // After session username is loaded, if it's still null, redirect
    if (!loggedInUsername) {
        // This case handles if sessionStorage was empty after useEffect,
        // and ensures the redirect happens *after* the client-side check.
        // The initial useEffect already pushes to signin, so this might be redundant but defensive.
        router.push('/signin');
        return null; // Don't render anything while redirecting
    }

    // Render the form once loggedInUsername is available
    return (
        <div className="container">
            {isLoading && ( // Show loading spinner specifically for data fetches/updates
                <>
                    <div className="spinner"></div>
                    <p>Processing...</p>
                </>
            )}

            <h1>Edit Profile</h1>
            <img src={profilePic || '/default-profile.png'} alt="Profile Picture" className="profile-pic" />
            {/* Input for photo. Use a ref or state for controlled component. */}
            <input
                type="file"
                name="profilePic" // Name for FormData
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
            />

            <input
                type="text"
                id="name-input" // Add an ID for specific targeting if you must use document.querySelector
                placeholder="Name"
                value={name} // Make this a controlled component
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
            />
            <input
                type="text"
                id="bio-input" // Add an ID
                placeholder="Bio"
                value={bio} // Make this a controlled component
                onChange={(e) => setBio(e.target.value)}
                required
                disabled={isLoading}
            />
            <button type="submit" onClick={handleEdit} disabled={isLoading}>
                Update Profile
            </button>
        </div>
    );
}