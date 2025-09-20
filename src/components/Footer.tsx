import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaInstagram } from 'react-icons/fa';
import { MdEmail, MdLocationOn } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { FaXTwitter } from "react-icons/fa6";

const Footer: React.FC = () => {
    const location = useLocation();
    const { user } = useAuth();
    const isReviewsPage = location.pathname === '/reviews';
    const isLoginPage = location.pathname === '/login';
    const isSignupPage = location.pathname === '/signup';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent transform skew-y-1"></div>
            </div>

            {/* Top Footer Section */}
            <div className="relative z-0 border-b border-slate-700/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                        {/* Company Info */}
                        <div className="lg:col-span-1 flex flex-col">
                            <div className="flex items-center space-x-2 mb-6">
                                {/* Logo + Title link */}
                                <Link to="/" className="inline-flex items-center group">
                                    <div className="relative">
                                        <img
                                            src="https://res.cloudinary.com/dlesei0kn/image/upload/v1749753063/file_Fashqr_icon_hzpvxi.png"
                                            alt="FlashQR Logo"
                                            className="w-12 h-12 md:w-10 md:h-10 transform group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-blue-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                    </div>
                                   <h1 className="text-2xl font-bold flash-title" style={{ fontSize: '16px', color: 'white' }}>
    FlashQR
</h1>
                                </Link>

                                {/* Rate Us link */}
                                <Link
                                    to="/reviews"
                                    className="text-[0.65rem] text-yellow-500 hover:text-yellow-600 transition-colors"
                                >
                                    Rate us
                                </Link>
                            </div>

                            <p className="text-slate-300 text-sm md:text-xs leading-relaxed mb-6">
                               A fast and lightweight QR code generator designed for simplicity and real-world use. Unlike most platforms, we focuses entirely on static QR codes—giving you reliable, permanent results without unnecessary complexity or confusing features.
                            </p>

                            {/* Social Links */}
<div className="flex space-x-4">
  <a
    href="https://instagram.com/flash__qr"
    target="_blank"
    rel="noopener noreferrer"
    className="group relative p-3 md:p-2 bg-slate-800/50 rounded-lg 
               hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 
               transition-all duration-300 transform hover:scale-110"
  >
    <FaInstagram className="h-5 w-5 md:h-4 md:w-4 text-slate-300 group-hover:text-white transition-colors" />
  </a>

  <a
  href="https://x.com/flash__qr"
  target="_blank"
  rel="noopener noreferrer"
  className="group relative p-3 md:p-2 bg-slate-800/50 rounded-lg 
             hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-600 
             transition-all duration-300 transform hover:scale-110"
>
  <FaXTwitter className="h-5 w-5 md:h-4 md:w-4 text-slate-300 group-hover:text-white transition-colors" />
</a>

</div>

                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-6 relative">
                                Quick Links
                                <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                            </h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link to="/about" className="text-slate-300 hover:text-blue-400 text-sm md:text-xs transition-colors duration-200 flex items-center group">
                                        <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 transform scale-0 group-hover:scale-100 transition-transform"></span>
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/contact" className="text-slate-300 hover:text-blue-400 text-sm md:text-xs transition-colors duration-200 flex items-center group">
                                        <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 transform scale-0 group-hover:scale-100 transition-transform"></span>
                                        Contact
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/faq" className="text-slate-300 hover:text-blue-400 text-sm md:text-xs transition-colors duration-200 flex items-center group">
                                        <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 transform scale-0 group-hover:scale-100 transition-transform"></span>
                                        FAQ
                                    </Link>
                                </li>
                               <li>
  <Link
  to="/plans-and-quota"
  className="text-slate-300 hover:text-blue-400 text-sm md:text-xs transition-colors duration-200 flex items-center group"
>
  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 transform scale-0 group-hover:scale-100 transition-transform"></span>
  Plans & Quota
</Link>

</li>

                            </ul>
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-6 relative">
                                Services
                                <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                            </h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link to="/generator" className="text-slate-300 hover:text-blue-400 text-sm md:text-xs transition-colors duration-200 flex items-center group">
                                        <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 transform scale-0 group-hover:scale-100 transition-transform"></span>
                                        QR Generator
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-6 relative">
                                Get in Touch
                                <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center text-slate-300 text-sm md:text-xs group">
                                    <MdEmail className="h-4 w-4 mr-3 text-blue-400 group-hover:text-purple-400 transition-colors" />
                                    <a href="mailto:contact.flashqr@gmail.com" className="hover:text-blue-400 transition-colors">
                                        contact.flashqr@gmail.com
                                    </a>
                                </div>
                                <div className="flex items-start text-slate-300 text-sm md:text-xs group">
                                    <MdLocationOn className="h-4 w-4 mr-3 text-blue-400 group-hover:text-purple-400 transition-colors mt-0.5" />
                                    <span>
                                        Srinagar<br />
                                        India, 190015
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer Section (Legal) */}
            <div className="relative">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 order-2 md:order-1">
                            <span>Built with ❤️ in India</span>
                            <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Tailored for Growth</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 order-1 md:order-2">
                            
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                                <Link to="/terms" className="hover:text-blue-400 transition-colors">
                                    Terms of Service
                                </Link>
                                <span>•</span>
                                <Link to="/privacy" className="hover:text-blue-400 transition-colors">
                                    Privacy Policy
                                </Link>
                            </div>
                          <p className="text-sm md:text-xs text-slate-400">
                                © {currentYear} FlashQR. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
