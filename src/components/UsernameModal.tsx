// src/components/UsernameModal.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

interface UsernameModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onClose, user }) => {
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSaveUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!username) {
            setError("Please enter a username.");
            return;
        }
        if (username.length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }
        if (username.length > 20) {
            setError("Username cannot exceed 20 characters.");
            return;
        }
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            setError("Username can only contain letters and numbers.");
            return;
        }

        setLoading(true);
        try {
            const now = new Date();
            // Create user document in Firestore[7][14]
            await setDoc(doc(db, "users", user.uid), {
                username,
                email: user.email,
                subscriptionPlan: "Free",
                quota: 20,
                qrCodesGenerated: 0,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                subscriptionExpiry: null,
            });

            onClose();
            navigate("/");
        } catch (err) {
            setError("Failed to save username. Please try again.");
            console.error("Error saving username:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">One last step!</h2>
                <p className="text-center text-gray-600 mb-6">Please choose a username to complete your profile.</p>

                <form onSubmit={handleSaveUsername}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="modal-username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                id="modal-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                                required
                            />
                            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
                        >
                            {loading ? "Saving..." : "Save and Continue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
