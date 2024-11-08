import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig'; 
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(undefined);
    const [friendsStatus, setFriendsStatus] = useState({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setUser(user);
                updateStatus('online');  // Set user status to online when logged in
                listenToFriendsStatus(user.uid);  // Listen to status updates of friends
            } else {
                setIsAuthenticated(false);
                setUser(null);
                setFriendsStatus({});
            }
        });

        return unsubscribe;
    }, []);

    // Function to listen to friends' status in real-time
    const listenToFriendsStatus = (userId) => {
        const friendsRef = doc(db, 'friends', userId);
        onSnapshot(friendsRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const friends = docSnapshot.data().friends || [];
                friends.forEach(async (friendId) => {
                    const friendRef = doc(db, 'users', friendId);
                    onSnapshot(friendRef, (friendDocSnapshot) => {
                        if (friendDocSnapshot.exists()) {
                            const friendStatus = friendDocSnapshot.data().status;
                            setFriendsStatus((prevState) => ({
                                ...prevState,
                                [friendId]: friendStatus,
                            }));
                        }
                    });
                });
            }
        });
    };

    // Login function
    const login = async (email, password) => {
        try {
            await updateStatus('online');
            const response = await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (e) {
            return { success: false, msg: e.message };
        }
    };

    // Register function
    const register = async (email, password, username) => {
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', response.user.uid), {
                username,
                userId: response.user.uid,
                email: response.user.email,
                status: 'offline',  // Set status to 'online' when user registers
            });
            setUser(response.user);
            setIsAuthenticated(true);
            return { success: true, data: response.user };
        } catch (e) {
            return { success: false, msg: e.message };
        }
    };

    // Update user's status in Firestore
   const updateStatus = async (status) => {
    if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { status }, { merge: true });
    }
};


    // Logout function
    const logout = async () => {
        try {
            await updateStatus('offline');  // Set user status to offline on logout
            await signOut(auth);
            setUser(null);
            setIsAuthenticated(false);
            return { success: true };
        } catch (e) {
            return { success: false, msg: e.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, friendsStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
