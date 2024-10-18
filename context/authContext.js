
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig'; 
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(undefined);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setUser(user);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        });

        return unsubscribe;
    }, []);
    const login =async(email,password)=>{
            try{
                    const response= await signInWithEmailAndPassword(auth,email,password)
                    return {success:true };
            }catch(e){
                    return {success:false,msg:e.message};
            }
    }
    const register = async (email, password, username) => {
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', response.user.uid), {
                username,
                userId: response.user.uid,
            });
            setUser(response.user);
            setIsAuthenticated(true);
            return { success: true, data: response.user };
        } catch (e) {
            return { success: false, msg: e.message };
        }
    };
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsAuthenticated(false);
            return { success: true };
        } catch (e) {
            return { success: false, msg: e.message };
        }
    };
    return (
        <AuthContext.Provider value={{ user, isAuthenticated,login, register ,logout}}>
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
