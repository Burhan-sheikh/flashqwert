import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Database, CreditCard, Users } from 'lucide-react';

const Privacy = () => {
  const privacyData = [
    {
      id: 'introduction',
      icon: <Shield className="w-6 h-6" />,
      title: 'Introduction',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Welcome to FlashQR. We are committed to protecting your privacy and being transparent about how we handle your information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our QR code generation platform.
          </p>
          <p className="text-gray-700 leading-relaxed">
            FlashQR is a professional QR code generation platform that allows you to create, customize, and export high-quality static QR codes for URLs. We offer both single QR code generation and bulk creation capabilities with advanced customization options.
          </p>
        </div>
      )
    },
    {
      id: 'information-collection',
      icon: <Database className="w-6 h-6" />,
      title: 'Information We Collect',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
            <p className="text-gray-700 leading-relaxed mb-2">When you create an account, we collect:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
  <li>Email address (for account creation and communication)</li>
  <li>Username (for account identification)</li>
  <li>Authentication credentials (securely handled by Firebase)</li>
  <li>Profile picture URL (live link from your Google account or an entered URL)</li>
</ul>

          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">QR Code Data</h4>
            <p className="text-gray-700 leading-relaxed mb-2">We store metadata about your QR codes to enable our features:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>QR Code names and associated URLs</li>
              <li>Creation dates and customization settings</li>
              <li>Logo uploads (if used)</li>
              <li>Collection organization data (Premium feature)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Payment Information</h4>
            <p className="text-gray-700 leading-relaxed mb-2">For subscription management:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Payment screenshots submitted for verification</li>
              <li>Transaction IDs (when provided)</li>
              <li>Subscription plan and status information</li>
              <li>Payment verification timestamps</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Usage Data</h4>
            <p className="text-gray-700 leading-relaxed mb-2">To improve our service:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Device and browser information</li>
              <li>IP address and general location</li>
              <li>Feature usage patterns</li>
              <li>Error logs and performance data</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'data-usage',
      icon: <Eye className="w-6 h-6" />,
      title: 'How We Use Your Information',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">We use your information to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Provide Core Services:</strong> Generate, store, and manage your QR codes</li>
            <li><strong>Enable Premium Features:</strong> QR code history, collections, and bulk generation</li>
            <li><strong>Process Payments:</strong> Verify subscription payments and manage billing</li>
            <li><strong>Improve User Experience:</strong> Optimize features and fix technical issues</li>
            <li><strong>Communicate:</strong> Send important account updates and support responses</li>
            <li><strong>Ensure Security:</strong> Protect against fraud and unauthorized access</li>
            <li><strong>Legal Compliance:</strong> Meet regulatory requirements and legal obligations</li>
          </ul>
        </div>
      )
    },
    {
      id: 'data-storage',
      icon: <Database className="w-6 h-6" />,
      title: 'Data Storage and Retention',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Feature-Based Storage</h4>
            <ul className="list-disc pl-6 text-blue-800 space-y-1">
              <li><strong>Free Plan:</strong> QR codes can be generated but are not saved for future access.</li>
<li><strong>Basic Plan:</strong> QR code history is saved and available for re-download.</li>
<li><strong>Standard Plan:</strong> Extended QR code history is saved and available for re-download.</li>
<li><strong>Premium Plan:</strong> Complete QR code history and collection data are stored, enabling advanced organization and management features.</li>

            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Retention Periods</h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Account Data:</strong> Retained while your account is active</li>
              <li><strong>QR Code Data:</strong> Stored according to your subscription level</li>
              <li><strong>Payment Records:</strong> Kept for verification and billing purposes</li>
              <li><strong>Usage Analytics:</strong> Aggregated data retained for service improvement</li>
            </ul>
          </div>

          <p className="text-gray-700 leading-relaxed">
            When you delete your account, we remove your personal data within 30 days, though some anonymized analytics may be retained for service improvement.
          </p>
        </div>
      )
    },
    {
      id: 'payment-privacy',
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Payment Processing and Privacy',
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">Payment Verification Process</h4>
            <ol className="list-decimal pl-6 text-yellow-800 space-y-1">
              <li>You make payment via UPI to our account: <span className="font-mono">flashqr.app@oksbi</span></li>
              <li>You submit a clear, unedited payment screenshot</li>
              <li>Our team reviews and verifies the payment within 24 hours</li>
              <li>Your subscription is activated upon successful verification</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Payment Data Security</h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Payment screenshots are watermarked for internal verification</li>
              <li>All payment proofs are stored securely and accessed only by authorized personnel</li>
              <li>We never store your UPI PIN, bank passwords, or sensitive financial credentials</li>
              <li>Payment verification data is retained for billing and dispute resolution</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Important Payment Guidelines</h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Submit clear, unedited screenshots showing transaction details</li>
              <li>Include transaction amount, UPI ID, date/time, and reference number</li>
              <li>Fake or edited screenshots result in permanent account suspension</li>
              <li>Payment proofs expire after 24 hours if not processed</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'data-sharing',
      icon: <Users className="w-6 h-6" />,
      title: 'Data Sharing and Disclosure',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">We Never Sell Your Data</h4>
            <p className="text-green-800">
              FlashQR does not sell, rent, or trade your personal information with third parties for marketing purposes.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Limited Sharing Circumstances</h4>
            <p className="text-gray-700 leading-relaxed mb-2">We may share information only in these specific situations:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Service Providers:</strong> Firebase (authentication), hosting providers, and payment processors</li>
              <li><strong>Legal Requirements:</strong> When required by law or to respond to legal processes</li>
              <li><strong>Safety Protection:</strong> To protect user rights, safety, and prevent fraud</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      icon: <Lock className="w-6 h-6" />,
      title: 'Security Measures',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We implement comprehensive security measures to protect your information:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Encryption:</strong> All data transmitted and stored is encrypted</li>
            <li><strong>Authentication:</strong> Secure Firebase authentication with industry standards</li>
            <li><strong>Access Controls:</strong> Strict access limitations for our team members</li>
            <li><strong>Regular Audits:</strong> Ongoing security assessments and updates</li>
            <li><strong>Secure Infrastructure:</strong> Hosted on reliable, secure cloud platforms</li>
          </ul>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-800 text-sm">
              <strong>Important:</strong> While we implement strong security measures, no internet transmission is 100% secure. We cannot guarantee absolute security but continuously work to protect your data.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'user-rights',
      icon: <Users className="w-6 h-6" />,
      title: 'Your Rights and Choices',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">You have the following rights regarding your personal information:</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Access Rights</h4>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>View your account information</li>
                <li>Access your QR code history</li>
                <li>Review subscription details</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Control Rights</h4>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Update account information</li>
                <li>Delete individual QR codes</li>
                <li>Manage collections</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Account Deletion</h4>
            <p className="text-gray-700 leading-relaxed">
              To delete your account and all associated data, contact us at{' '}
              <a href="mailto:contact.flashqr@gmail.com" className="text-blue-600 hover:underline font-medium">
                contact.flashqr@gmail.com
              </a>
              . Premium users can also use the priority contact form. Account deletion is permanent and cannot be undone.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'international',
      icon: <Database className="w-6 h-6" />,
      title: 'International Data Transfers',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            FlashQR operates from India, but our services use international cloud infrastructure. Your information may be transferred to and stored in countries outside your residence where data protection laws may differ.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We ensure appropriate safeguards are in place to protect your information during international transfers, including using reputable service providers with strong privacy commitments.
          </p>
        </div>
      )
    },
    {
      id: 'children',
      icon: <Shield className="w-6 h-6" />,
      title: 'Children\'s Privacy',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            FlashQR is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
          </p>
          <p className="text-gray-700 leading-relaxed">
            If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
          </p>
        </div>
      )
    },
    {
      id: 'changes',
      icon: <Eye className="w-6 h-6" />,
      title: 'Changes to This Policy',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Posting the updated policy on our website</li>
            <li>Updating the "Last Updated" date</li>
            <li>Sending email notifications for significant changes</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
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
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-900">Email:</span>
                <a href="mailto:contact.flashqr@gmail.com" className="ml-2 text-blue-600 hover:underline">
                  contact.flashqr@gmail.com
                </a>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Business Location:</span>
                <span className="ml-2 text-gray-700">India, Jammu and Kashmir</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Business Model:</span>
                <span className="ml-2 text-gray-700">Remote development (no physical office)</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Response Time:</span>
                <span className="ml-2 text-gray-700">Within 24 hours (Premium users: 4-6 hours)</span>
              </div>
            </div>
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
            <Shield className="w-8 h-8 text-blue-600" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Your privacy is important to us. Learn how we collect, use, and protect your information.
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

        {/* Privacy Sections */}
        <div className="space-y-8">
          {privacyData.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <div className="text-blue-600">
                    {section.icon}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="text-gray-700">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Privacy Commitment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-12 bg-blue-50 rounded-2xl p-8 text-center border-2 border-blue-200"
        >
          <h3 className="text-2xl font-bold text-blue-900 mb-4">
            Our Privacy Commitment
          </h3>
          <p className="text-blue-800 text-lg">
            We are committed to protecting your privacy and maintaining the security of your personal information. 
            If you have any concerns or questions about our privacy practices, please don't hesitate to contact us.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
