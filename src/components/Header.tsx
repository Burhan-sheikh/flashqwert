// /home/project/src/components/Header.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { LogoutButton } from "../components/LogoutButton";

import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebase/firebase';

import {
    User,
    Menu,
    X,
    ChevronDown,
    Settings,
    LogOut,
    Shield
} from 'lucide-react';

import SearchBar from './SearchBar'; // Assuming SearchBar is imported here
import SignUpModal from '../components/SignUpModal'; // Import SignUpModal

interface HeaderProps {
    onMenuToggle: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [username, setUsername] = useState(null);
    const [isLoadingUsername, setIsLoadingUsername] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [menuSearchBar, setMenuSearchBar] = useState(false)
    const [profileDropdownRef, setProfileDropdownRef] = useState(null)
    const [signUpModalOpen, setSignUpModalOpen] = useState(false); // State for SignUpModal visibility
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(prevState => !prevState);
        onMenuToggle(!isMenuOpen);
    }, [isMenuOpen, onMenuToggle]);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
        onMenuToggle(false);
    }, [onMenuToggle]);

    const toggleProfileDropdown = useCallback(() => {
        setIsProfileDropdownOpen(prev => !prev);
    }, []);

    const closeProfileDropdown = useCallback(() => {
        setIsProfileDropdownOpen(false);
    }, []);

    // Function to open the SignUpModal
    const openSignUpModal = () => {
        setSignUpModalOpen(true);
    };

    // Function to close the SignUpModal
    const closeSignUpModal = () => {
        setSignUpModalOpen(false);
    };

    useEffect(() => {
        const fetchUsernameAndProfile = async () => {
            if (!user?.uid) {
                setUsername(null);
                setProfilePicture(null);
                setIsAdmin(false);
                return;
            }
            setIsLoadingUsername(true);
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUsername(userData.username);
                    setProfilePicture(user.photoURL || null);
                    setIsAdmin(userData.isAdmin || false);
                } else {
                    console.warn("User document not found for UID:", user.uid);
                    setUsername(null);
                    setProfilePicture(null);
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error("Error fetching username:", error);
                setIsAdmin(false);
            } finally {
                setIsLoadingUsername(false);
            }
        };
        if (user) {
            fetchUsernameAndProfile();
        } else {
            setUsername(null);
            setProfilePicture(null);
            setIsAdmin(false);
        }
    }, [user]);

    // Handle click outside for mobile menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.classList.add('no-scroll'); // Add class
        } else {
            document.body.classList.remove('no-scroll'); // Remove class
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.classList.remove('no-scroll'); // Cleanup
        };
    }, [isMenuOpen, closeMenu]);

    // Handle click outside for profile dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                closeProfileDropdown();
            }
        };
        if (isProfileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileDropdownOpen, closeProfileDropdown]);

    const navLinks = [
        { to: "/faq", label: "FAQ" },
        { to: "/contact", label: "Contact" },
        { to: "/plans-and-quota", label: "Plans" },
        ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
    ];

    const legalLinks = [
        { to: "/terms", label: "Terms" },
        { to: "/privacy", label: "Privacy" },
    ];

    // Check if we're on the LogOutHome page (root path and user is not logged in)
    const isLogOutHomePage = location.pathname === '/' && !user;

    const ProfileAvatar = ({ size = "md", showName = false }) => {
        const sizeClasses = {
            sm: "h-8 w-8",
            md: "h-10 w-10",
            lg: "h-12 w-12"
        };
        return (
            <div className="flex items-center space-x-3">
                <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold overflow-hidden`}>
                    {profilePicture ? (
                        <img
                            src={profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-sm">
                            {username ? username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </span>
                    )}
                </div>
                {showName && (
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {isLoadingUsername ? "Loading..." : username || "User"}
                        </p>
                        <p className="text-xs text-gray-500">
                            {user?.email}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <header className={`bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100 ${isLogOutHomePage ? 'pb-0' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Mobile structure: menu icon | logo | search */}
                        <div className="flex items-center lg:hidden w-full">
                            <button
                                onClick={toggleMenu}
                                className="rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-50 focus:outline-none transition-colors duration-200 mr-3"
                                aria-label="Toggle menu"
                            >
                                {isMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                            {/* Profile Icon on the far left (only avatar, no name/email) */}
{user && (
  <Link to="/profile" className="mr-4">
    <ProfileAvatar size="sm" showName={false} />
  </Link>
)}

                            <div className="flex-grow mr-2">
                                <SearchBar 
                                    onSearchClick={!user ? openSignUpModal : undefined} // Pass the openSignUpModal function
                                />
                            </div>

                          <Link to="/" className="flex items-center space-x-2 p-0 logo-text" style={{ textDecoration: 'none' }}>
                                <img
                                    src="https://res.cloudinary.com/dlesei0kn/image/upload/v1749753063/file_Fashqr_icon_hzpvxi.png"
                                    alt="FlashQR Logo"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        display: 'inline-block',
                                    }}
                                />
                            </Link>
                        </div>

                        {/* Desktop structure: menu button | logo | searchBar | profile dropdown */}
                        <div className="hidden lg:flex items-center w-full">
                            <button
                                onClick={toggleMenu}
                                className="rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-50 focus:outline-none transition-colors duration-200 mr-4"
                                aria-label="Toggle menu"
                            >
                                {isMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                            
                            <div className="flex-grow mr-2">
                                <SearchBar 
                                    onSearchClick={!user ? openSignUpModal : undefined} // Pass the openSignUpModal function
                                />
                            </div>
                            <Link to="/" className="flex items-center space-x-2 p-0 logo-text" style={{ textDecoration: 'none' }}>
                                <img
                                    src="https://res.cloudinary.com/dlesei0kn/image/upload/v1749753063/file_Fashqr_icon_hzpvxi.png"
                                    alt="FlashQR Logo"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        display: 'inline-block',
                                    }}
                                />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Slide-out Menu (shared for mobile and PC) */}
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
                        {/* Menu Panel */}
                        <div
                            ref={menuRef}
                            className="fixed top-0 left-0 h-full w-80 max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col"
                        >
                            {/* Fixed User Section */}
                            {user && (
                                <div className="sticky top-0 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 z-20">
                                    <Link to="/profile" onClick={closeMenu} className="block">
                                        <ProfileAvatar size="lg" showName={true} />
                                    </Link>
                                </div>
                            )}
                            <div className="overflow-y-auto flex-1">
                                {/* Navigation */}
                                <nav className="flex-1 p-4">
                                    <div className="space-y-1">
                                        {navLinks.map(link => (
                                            <NavLink
                                                key={link.to}
                                                to={link.to}
                                                onClick={closeMenu}
                                                className={({ isActive }) =>
                                                    `flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                                                        isActive
                                                            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    }`
                                                }
                                            >
                                                {link.icon && <link.icon className="w-5 h-5" />}
                                                <span>{link.label}</span>
                                            </NavLink>
                                        ))}
                                        <NavLink
                                            to="/enhanced-generator"
                                            onClick={closeMenu}
                                            className={({ isActive }) =>
                                                `flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }`
                                            }
                                        >
                                            <Layers className="w-5 h-5" />
                                            <span>Enhanced Generator</span>
                                        </NavLink>
                                    </div>
                                    {/* Legal Links */}
                                    <div className="mt-8 pt-4 border-t border-gray-200">
                                        <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Legal
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {legalLinks.map(link => (
                                                <NavLink
                                                    key={link.to}
                                                    to={link.to}
                                                    onClick={closeMenu}
                                                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    {link.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                </nav>
                            </div>
                            {/* Footer */}
                            <div className="sticky bottom-0 p-4 border-t border-gray-200 bg-gray-50 z-10">
                                {user ? (
                                    <LogoutButton
                                        className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                                        showIcon={true}
                                        showLabel={true}
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <NavLink
                                            to="/login"
                                            onClick={closeMenu}
                                            className="block w-full text-center px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Login
                                        </NavLink>
                                        <NavLink
                                            to="/signup"
                                            onClick={closeMenu}
                                            className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                                        >
                                            Sign Up
                                        </NavLink>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
                  {/* Conditionally render SignUpModal */}
                  {isLogOutHomePage && (
                        <SignUpModal isOpen={signUpModalOpen} onClose={closeSignUpModal} onSuccess={closeSignUpModal} />
                    )}
            </header>
        </>
    );
};

export default Header;
