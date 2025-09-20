import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, CreditCard, Users } from 'lucide-react';

const Terms = () => {
  const termsData = [
    {
      id: 'acceptance',
      icon: <FileText className="w-6 h-6" />,
      title: 'Acceptance of Terms',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            By accessing or using FlashQR ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
          </p>
          <p className="text-gray-700 leading-relaxed">
            FlashQR is a QR code generation platform located at <span className="font-medium">flashqr.netlify.app</span>, designed for creating, customizing, and exporting professional QR codes for individuals, creators, and businesses.
          </p>
        </div>
      )
    },
    {
      id: 'service-description',
      icon: <Users className="w-6 h-6" />,
      title: 'Service Description',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            FlashQR provides QR code generation services including:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Static QR code creation for URLs</li>
            <li>Custom color and logo options</li>
            <li>Multiple export formats (PNG, JPG, PDF)</li>
            <li>Bulk QR code generation and collections (Premium feature)</li>
            <li>QR code history (Standard/Premium features)</li>
            <li>Advanced PDF export layouts (Premium feature)</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            All QR codes generated are static and cannot be edited once created. We do not offer dynamic QR codes or real-time analytics.
          </p>
        </div>
      )
    },
    {
      id: 'user-accounts',
      icon: <Users className="w-6 h-6" />,
      title: 'User Accounts and Responsibilities',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            To use FlashQR, you must create an account using supported authentication methods. You are responsible for:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Ensuring the accuracy of information you provide</li>
            <li>Complying with all applicable laws and regulations</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.
          </p>
        </div>
      )
    },
    {
      id: 'content-usage',
      icon: <Shield className="w-6 h-6" />,
      title: 'Content Ownership and Prohibited Use',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            You retain full ownership of the URLs and content you embed in QR codes. By uploading logos or custom content, you confirm you have the necessary rights to use such content.
          </p>
          <p className="text-gray-700 leading-relaxed font-semibold">
            Prohibited Uses:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Creating QR codes linking to illegal, harmful, or malicious content</li>
            <li>Generating QR codes for phishing, fraud, or deceptive purposes</li>
            <li>Interfering with or disrupting the platform or its servers</li>
            <li>Attempting unauthorized access to any part of the service</li>
            <li>Using the service to violate any applicable laws or regulations</li>
          </ul>
        </div>
      )
    },
    {
      id: 'subscriptions',
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Subscriptions and Payments',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            FlashQR offers the following subscription plans:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Basic (₹599/month):</strong> 200 QR codes, PNG/JPG/PDF downloads, logo upload, email support</li>
            <li><strong>Standard (₹1,599/month):</strong> 500 QR codes, all Basic features, QR code history access</li>
            <li><strong>Premium (₹1,999/month):</strong> 1000 QR codes, all Standard features, bulk generation, collections, priority support</li>
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-semibold mb-2">Payment Process:</p>
            <ol className="list-decimal pl-6 text-blue-700 space-y-1">
              <li>Select your desired plan</li>
              <li>Pay via UPI to: <span className="font-mono">flashqr.app@oksbi</span></li>
              <li>Submit payment screenshot with your registered email</li>
              <li>Plan activation within 24 hours after verification</li>
            </ol>
          </div>

          <p className="text-gray-700 leading-relaxed">
            <strong>Important:</strong> Each plan lasts for 1 month. No refunds are provided for unused time or features. When subscriptions expire, accounts revert to the Free plan.
          </p>
        </div>
      )
    },
    {
      id: 'data-retention',
      icon: <Shield className="w-6 h-6" />,
      title: 'Data Retention and Privacy',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We store the following data to provide our services:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Account information (email, username, profile url)</li>
            <li>QR code metadata (names, URLs, creation dates, customization settings)</li>
            <li>Subscription and payment information</li>
            <li>Usage analytics for service improvement</li>
          </ul>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 font-semibold mb-2">Feature-Based Data Storage:</p>
            <ul className="list-disc pl-6 text-green-700 space-y-1">
              <li><strong>Standard Plan:</strong> QR code history stored for re-download purposes</li>
              <li><strong>Premium Plan:</strong> QR code history and collection data for organization features</li>
            </ul>
          </div>

          <p className="text-gray-700 leading-relaxed">
            We are committed to protecting your privacy and never sell your personal data to third parties. For complete privacy details, please review our Privacy Policy.
          </p>
        </div>
      )
    },
    {
      id: 'intellectual-property',
      icon: <Shield className="w-6 h-6" />,
      title: 'Intellectual Property',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            All FlashQR branding, visual design, code, and proprietary features are the intellectual property of FlashQR. You may not:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Copy, reproduce, or reuse our designs, logos, or UI/UX elements</li>
            <li>Reverse engineer or attempt to extract our source code</li>
            <li>Create derivative works based on our platform</li>
            <li>Use our branding or trademarks without written permission</li>
          </ul>
        </div>
      )
    },
    {
      id: 'limitations',
      icon: <FileText className="w-6 h-6" />,
      title: 'Service Limitations and Liability',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            FlashQR provides services "as is" and makes no warranties regarding:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Continuous, uninterrupted service availability</li>
            <li>QR code scanning compatibility with all devices</li>
            <li>Third-party scanner functionality or reliability</li>
            <li>Accessibility of external URLs linked in QR codes</li>
          </ul>
          
          <p className="text-gray-700 leading-relaxed">
            <strong>Limitation of Liability:</strong> FlashQR is not liable for any indirect, incidental, or consequential damages resulting from the use of our services — including, but not limited to, loss of business, data, or printing costs.
          </p>
        </div>
      )
    },
    {
      id: 'termination',
      icon: <Users className="w-6 h-6" />,
      title: 'Account Termination',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Either party may terminate the service relationship:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>By You:</strong> Stop using the service or request account deletion</li>
            <li><strong>By Us:</strong> For violations of these terms, illegal activity, or service abuse</li>
          </ul>
          
          <p className="text-gray-700 leading-relaxed">
            Upon termination, you will retain access to any QR codes generated during your subscription. However, premium features such as QR code history and collections management will be disabled unless you resubscribe.
          </p>
        </div>
      )
    },
    {
      id: 'changes',
      icon: <FileText className="w-6 h-6" />,
      title: 'Changes to Terms',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to our website. Continued use of the service after changes constitutes acceptance of the revised terms.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We recommend reviewing these terms periodically to stay informed of any updates.
          </p>
        </div>
      )
    },
    {
      id: 'contact',
      icon: <Users className="w-6 h-6" />,
      title: 'Contact Information',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            For questions about these Terms and Conditions, please contact us:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="space-y-2 text-gray-700">
              <li><strong>Email:</strong> contact.flashqr@gmail.com</li>
              <li><strong>Country:</strong> India</li>
              <li><strong>State:</strong> Jammu and Kashmir</li>
              <li><strong>Business Model:</strong> Remote development (no physical office)</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6"
          >
            <FileText className="w-8 h-8 text-blue-600" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4"
          >
            Terms and Conditions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Please read these terms carefully before using FlashQR
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-gray-500 mt-4"
          >
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </motion.p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {termsData.map((term, index) => (
            <motion.div
              key={term.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <div className="text-blue-600">
                    {term.icon}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{term.title}</h2>
              </div>
              <div className="text-gray-700">
                {term.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Agreement Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-12 bg-blue-50 rounded-2xl p-8 text-center border-2 border-blue-200"
        >
          <h3 className="text-2xl font-bold text-blue-900 mb-4">
            Agreement Acknowledgment
          </h3>
          <p className="text-blue-800 text-lg">
            By using FlashQR, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
