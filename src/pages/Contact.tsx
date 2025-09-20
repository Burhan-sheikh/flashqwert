import React, { useEffect, useState } from 'react';
import { Mail, MessageSquare, Clock, Zap, ChevronDown, Loader2, Smartphone, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { motion, AnimatePresence } from 'framer-motion';

// Updated WhatsApp Icon Component using Lucide React
const WhatsAppIcon = ({ color = 'currentColor', size = 20 }: { color?: string; size?: number }) => (
    <MessageSquare color={color} size={size} />
);

const Contact = () => {
    const { user } = useAuth();
    const [userPlan, setUserPlan] = useState<string>('Free');
    const [loading, setLoading] = useState(true);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email');

    useEffect(() => {
        const fetchUserPlan = async () => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data();
                        setUserPlan(data.subscriptionPlan || 'Free');
                    }
                } catch (err) {
                    console.error("Error fetching user document:", err);
                }
            }
            setLoading(false);
        };
        fetchUserPlan();
    }, [user]);

    // Use the default email instead of user's email
    const currentEmail = 'contact.flashqr@gmail.com'; 
    const isPremium = userPlan === 'Premium';
    const whatsappLink = "https://wa.me/916006072335";

    const faqs = [
        {
            question: "How long does support usually take to respond?",
            answer: "We aim to respond to all email inquiries within 24 hours.  WhatsApp 'premium' users typically receive responses within 4-6 hours."
        },
        {
            question: "Do you offer enterprise solutions?",
            answer: "Yes! Contact us with your requirements and we'll provide a customized solution for your business needs."
        }
    ];

    const toggleFaq = (index: number) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-gray-600">Loading your contact options...</p>
            </div>
        );
    }

    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        How can we <span className="text-blue-600">help you</span> today?
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                        Whether you have questions, need technical support, or want to discuss business opportunities, our team is ready to assist.
                    </p>
                </motion.div>

                {/* Contact Options */}
                <div className="mb-20">
                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'email' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                <span className="flex items-center text-xs">
                                    <Mail className="w-5 h-5 mr-2" />
                                    Email Support
                                </span>
                            </button>
                            {isPremium && (
                                <button
                                    onClick={() => setActiveTab('whatsapp')}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'whatsapp' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
                                >
                                    <span className="flex items-center text-xs">
                                        <WhatsAppIcon color={activeTab === 'whatsapp' ? '#4CAF50' : 'currentColor'} size={20} />
                                        <span className="ml-2">WhatsApp</span>
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-2xl mx-auto"
                    >
                        {activeTab === 'email' ? (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Support</h2>
                                    <p className="text-gray-600">Our team will get back to you as soon as possible.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="bg-blue-50 p-3 rounded-lg mr-4">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-1">Response Time</h3>
                                            <p className="text-gray-600">
                                                Within 24 hours
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="bg-blue-50 p-3 rounded-lg mr-4">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-1">Contact Email</h3>
                                            <a
                                                href={`mailto:${currentEmail}`}
                                                className="text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                {currentEmail}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 text-center">
                                    <a
                                        href={`mailto:${currentEmail}`}
                                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                    >
                                        Send Email
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <WhatsAppIcon color="#4CAF50" size={36} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium WhatsApp Support</h2>
                                    <p className="text-gray-600">Get faster responses with our dedicated WhatsApp channel.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="bg-green-50 p-3 rounded-lg mr-4">
                                            <Clock className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-1">Response Time</h3>
                                            <p className="text-gray-600">Typically within 4-6 hours</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="bg-green-50 p-3 rounded-lg mr-4">
                                            <Zap className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-1">Premium Feature</h3>
                                            <p className="text-gray-600">Exclusive to Premium plan subscribers</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 text-center">
                                    <a
                                        href={whatsappLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                                    >
                                        Message on WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Common Questions</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Quick answers to questions you might have about our services and support.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                                whileHover={{ y: -2 }}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex justify-between items-center p-6 text-left"
                                >
                                    <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                                    <ChevronDown
                                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {expandedFaq === index && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="px-6 pb-6 text-gray-600"
                                        >
                                            {faq.answer}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                {!isPremium && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        viewport={{ once: true }}
                        className="mt-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 sm:p-12 text-center"
                    >
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Upgrade for Priority Support</h3>
                        <p className="text-blue-100 max-w-2xl mx-auto mb-8">
                            Premium users get faster response times and direct access to our team via WhatsApp.
                        </p>
                        <a
                            href="/plans-and-quota"
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-blue-600 bg-white hover:bg-gray-50 transition-colors"
                        >
                            View Plans
                            <Zap className="w-5 h-5 ml-2 text-blue-600" />
                        </a>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Contact;
