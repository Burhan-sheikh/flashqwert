import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PulseLoader } from "react-spinners";
import { Tab } from '@headlessui/react';
import { 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import PaymentProofsTable from "../components/AdminDashboard/PaymentProofsTable";
import UserManagementTable from "../components/AdminDashboard/UserManagementTable";

const AdminDashboard = () => {
    // Plans data - same as in PlansAndPricing.jsx
    const plans = [
        {
            name: "Basic",
            price: "$9.99",
            period: "month",
            features: [
                "Generate up to 100 QR codes",
                "Basic customization options",
                "Standard support",
                "Download as PNG/SVG"
            ],
            qrLimit: 100,
            popular: false
        },
        {
            name: "Standard",
            price: "$19.99",
            period: "month",
            features: [
                "Generate up to 500 QR codes",
                "Advanced customization",
                "Priority support",
                "Download as PNG/SVG/PDF",
                "Bulk generation",
                "Analytics tracking"
            ],
            qrLimit: 500,
            popular: true
        },
        {
            name: "Premium",
            price: "$39.99",
            period: "month",
            features: [
                "Unlimited QR codes",
                "Full customization suite",
                "24/7 premium support",
                "All download formats",
                "Advanced analytics",
                "API access",
                "White-label options"
            ],
            qrLimit: -1,
            popular: false
        }
    ];

    const [paymentProofs, setPaymentProofs] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isAdmin, setIsAdmin] = useState(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchTotalUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            setTotalUsers(usersSnapshot.size);
        } catch (error) {
            console.error("Error fetching total users:", error);
            toast.error("Failed to load total users");
        }
    };


    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const proofsSnapshot = await getDocs(collection(db, "paymentProofs"));
            const proofs = proofsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPaymentProofs(proofs);

            const allUsersSnapshot = await getDocs(collection(db, "users"));
            const users = allUsersSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllUsers(users);

            await fetchTotalUsers(); // Only fetch total users
            toast.success("Data refreshed successfully");
        } catch (error) {
            console.error("Error refreshing data:", error);
            toast.error("Failed to refresh data");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                navigate("/login");
                return;
            }

            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    toast.error("User record not found.");
                    navigate("/");
                    return;
                }

                const userData = userSnap.data();
                if (!userData.isAdmin) {
                    setIsAdmin(false);
                    navigate("/");
                    return;
                }

                setIsAdmin(true);

                await refreshData();

            } catch (error) {
                console.error("Error:", error);
                toast.error("Error checking admin status or fetching data.");
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return "N/A";
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Error logging out:", error);
            toast.error("Failed to log out");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <PulseLoader color="#4F46E5" size={15} />
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-gray-900">Access Denied</h1>
                    <p className="mt-2 text-gray-600">
                        You don't have permission to access this page.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-2" />
                        Admin Dashboard
                    </h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={refreshData}
                            disabled={isRefreshing}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                    <UserGroupIcon className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-2xl font-semibold text-gray-900">{totalUsers}</div>
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                        <Tab.List className="border-b border-gray-200">
                            <div className="flex">
                                <Tab
                                    className={({ selected }) =>
                                        `px-6 py-4 text-sm font-medium border-b-2 ${selected
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`
                                    }
                                >
                                    Payment Proofs
                                </Tab>
                                <Tab
                                    className={({ selected }) =>
                                        `px-6 py-4 text-sm font-medium border-b-2 ${selected
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`
                                    }
                                >
                                    User Management
                                </Tab>
                            </div>
                        </Tab.List>
                        <Tab.Panels className="p-6">
                            <Tab.Panel>
                                <PaymentProofsTable
                                    paymentProofs={paymentProofs}
                                    setPaymentProofs={setPaymentProofs}
                                    formatDate={formatDate}
                                    plans={plans}
                                />
                            </Tab.Panel>
                            <Tab.Panel>
                                <UserManagementTable
                                    allUsers={allUsers}
                                    setAllUsers={setAllUsers}
                                    formatDate={formatDate}
                                />
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </main>

            <ToastContainer
                position="bottom-center"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                toastClassName="shadow-lg"
                style={{ marginBottom: '20px' }}
            />
        </div>
    );
};

export default AdminDashboard;
