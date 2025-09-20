import React, { createContext, useEffect, useState, useContext } from "react";
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence, signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    isAuthenticated: boolean; // Add isAuthenticated state
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    isAuthenticated: false, // Default value for isAuthenticated
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // New state

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsAuthenticated(false); // Update isAuthenticated on logout
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    useEffect(() => {
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                    setUser(firebaseUser);
                    setLoading(false);
                    setIsAuthenticated(!!firebaseUser); // Update isAuthenticated based on user
                });

                return () => unsubscribe();
            })
            .catch((error) => {
                console.error("Error setting auth persistence:", error);
                setLoading(false);
            });
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, logout, isAuthenticated }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
