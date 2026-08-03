//Context lets components pass information deep down without explicitly passing props.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

//Values for the authentication
type AuthContextValue = {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    logOut: () => Promise<void>;
};

//Creates a context for the authorisation and allows it to be undefined if needed
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider ({children}: {children: ReactNode}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //Allows the user to unsubscribe by calling when the login state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    //Creates a new user account associated with the specified email address and password.
    async function signUp(email: string, password: string) {
       const credential = await createUserWithEmailAndPassword(auth, email, password);
       //Builds a reference to the user's document
       await setDoc(doc(db, 'users', credential.user.uid), {
        displayName: '',
        themePreference: 'auto',
       });
    }

    //Asynchronously signs in using an email and password.
    async function signIn(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email, password);
    }

    //Signs out the current user.
    async function logOut() {
        await signOut(auth);
    }

    return (
        //Provider wraps app into a box
        <AuthContext.Provider value = {{user, loading, signUp, signIn, logOut}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    //Accepts a context object and returns the current context value.
    const context = useContext(AuthContext);
    if(!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
}



