import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "What is FlashQR?",
          a: "FlashQR is a professional QR code generation platform that allows you to create, customize, and export high-quality static QR codes. You can generate single QR codes or create multiple QR codes in bulk (Premium feature) using CSV files, with options for custom colors, logos, and professional PDF layouts."
        },
        {
          q: "Do I need an account to use FlashQR?",
          a: "Yes, you need to create a free account to generate QR codes. This allows us to save your QR code history (for paid plan users), manage your quota, and provide you with access to advanced features like collections and bulk generation."
        },
        {
          q: "What types of QR codes can I create?",
          a: "FlashQR specializes in static URL QR codes. You can create QR codes that link to any website, social media profile, online menu, portfolio, or any other URL. We focus on static QR codes to ensure they work reliably forever without depending on our servers."
        },
        {
          q: "Is FlashQR free to use?",
          a: "FlashQR offers a free plan with 30 QR codes and basic features. For advanced features like expanded QR code history, bulk generation, more collections, and professional PDF exports, we offer paid plans starting at ₹599 per month."
        }
      ]
    },
    {
      category: "QR Code Generation",
      questions: [
        {
          q: "Can I customize my QR codes?",
          a: "Yes! You can customize QR code colors, background colors, upload your own logo, adjust error correction levels, and choose from different sizes. Premium users also get access to advanced export layouts and bulk customization options."
        },
        {
          q: "Can I generate multiple QR codes at once?",
          a: "Yes, with our Premium plan you can use bulk QR generation. Simply upload a CSV file with your QR code names and URLs, and we'll generate all of them at once. This feature includes error validation and a preview of the uploaded entries before generation."
        },
        {
  q: "What file formats can I download my QR codes in?",
  a: "All plans support PNG, JPG, and PDF downloads for single QR codes. Collections can be exported as professional PDF documents with Standard and Grid layouts (Premium users get Advanced Collection Export features)."
},
        {
          q: "How do I upload a CSV for bulk generation?",
          a: "In the QR generator, switch to 'Bulk' mode and click 'Import CSV'. Your file must include 'name' and 'url' columns. A downloadable template is available, and after uploading, you'll see a preview of the entries along with any detected errors before generating your QR codes."
        }
      ]
    },
    {
      category: "Plans & Pricing",
      questions: [
        {
          q: "What are the differences between plans?",
          a: "Free: 30 QR codes, 1 collection, basic features. Basic (₹599/month): 300 QR codes, 10 collections, QR history (900 storage). Standard (₹1,299/month): 900 QR codes, 30 collections, QR history (2,700 storage). Premium (₹2,499/month): 1,500 QR codes, 50 collections, bulk generation, advanced export, priority support, QR history (4,500 storage)."
        },
        {
          q: "How does the payment process work?",
          a: "After selecting a plan, a modal will open displaying the UPI ID, QR code, and account holder name. Complete the payment using any UPI app, then upload a screenshot of your payment as proof directly in the modal. Your plan will be activated within 24 hours after successful verification."
        },
        {
          q: "What payment methods do you accept?",
          a: "We currently accept payments via UPI (Unified Payments Interface) to our UPI ID: flashqr.app@oksbi. This includes payments from Google Pay, PhonePe, Paytm, and all major UPI-enabled apps."
        },
        {
          q: "Can I get a refund?",
          a: "Due to the digital nature of our service and manual verification process, we do not offer refunds for unused time or features. Please carefully review the plan features before purchasing."
        },
        {
          q: "What happens when my subscription expires?",
          a: "You'll retain all QR codes generated during your subscription, but access to certain features—like expanded QR code history, bulk generation, and additional collections—will be temporarily disabled based on Free plan limits. These features will become available again once you resubscribe."
        }
      ]
    },
    {
      category: "Features & Collections",
      questions: [
        {
          q: "What are Collections?",
          a: "Collections allow you to organize your QR codes into groups for better management. Free users get 1 collection, Basic users get up to 10, Standard users get up to 30, and Premium users get up to 50 collections. You can export entire collections as professional PDF documents."
        },
        {
          q: "Can I edit a QR code after creating it?",
          a: "No, QR codes cannot be edited once created. This is because QR codes are static and changing them would break existing printed materials or shared links. If you need changes, you'll need to create a new QR code."
        },
        {
          q: "How long do my QR codes last?",
          a: "Your QR codes are static and will work forever as long as the destination URL remains active. They don't depend on our servers to function, ensuring maximum reliability for your printed materials and campaigns."
        },
        {
          q: "What is QR code history?",
          a: "QR code history allows you to view and re-download QR codes you've previously created. Free users can store 30 codes, Basic users 900 codes, Standard users 2,700 codes, and Premium users 4,500 codes. This is useful for reprinting materials or accessing QR codes across different devices."
        }
      ]
    },
    {
      category: "Technical & Troubleshooting",
      questions: [
        {
          q: "Why did my CSV upload fail?",
          a: "Common issues include: missing 'name' and 'url' column headers, invalid URLs, empty fields, or incorrect file format. Ensure your CSV is saved in UTF-8 format and all URLs start with 'http://' or 'https://'. Use our template for the correct format."
        },
        {
          q: "What image formats can I use for logos?",
          a: "You can upload PNG, JPG, or JPEG images for logos. The file size must be under 700KB. For best results, use square images with transparent backgrounds (PNG format)."
        },
        {
          q: "Why can't I access bulk generation?",
          a: "Bulk QR code generation is a Premium-only feature. You'll need to upgrade to the Premium plan (₹2,499/month) to access this functionality along with advanced export options and expanded storage."
        },
        {
          q: "My QR code isn't scanning properly. What should I do?",
          a: "Ensure the QR code is printed clearly without distortion, has enough contrast, and isn’t too small. The QR code itself should not be white, while the background can be any color. For better scanning reliability, use a 'Medium' or 'High' error correction level—especially if you're including a logo in the QR code."
        }
      ]
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          q: "How do you protect my data?",
          a: "We implement strong security measures including encrypted data storage, secure authentication, and regular security assessments. We never sell your data to third parties and only store necessary information to provide our services."
        },
        {
          q: "What data do you store?",
          a: "We store your email, username, QR code metadata (names, URLs, creation dates), and customization settings. For Standard and Premium users, we also store QR code history and collection information to enable those features."
        },
        {
          q: "Can I delete my account and data?",
          a: "Yes, you can request account deletion by emailing us at contact.flashqr@gmail.com. If you have a Premium subscription, you can also use the direct contact form available on the Contact page. Once requested, your account and all associated data will be permanently deleted within 30 days."
        }
      ]
    },
    {
      category: "Support",
      questions: [
        {
          q: "How can I contact support?",
          a: "You can reach our support team by emailing contact.flashqr@gmail.com. Premium users receive priority support with faster response times, typically within 4–6 hours. All other users can expect a response within 24 hours."
        },
        {
          q: "Do you offer enterprise solutions?",
          a: "For enterprise needs or custom requirements, please reach out to us at contact.flashqr@gmail.com with details of your request. We’re happy to discuss tailored solutions, increased usage limits, or specialized features to support your organization."
        }
      ]
    }
  ];

  const handleToggle = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Find answers to common questions about FlashQR's features, pricing, and functionality
          </motion.p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIdx) => (
            <motion.div
              key={categoryIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIdx * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{category.category}</h2>
              </div>

              {/* Questions */}
              <div className="divide-y divide-gray-200">
                {category.questions.map((faq, faqIdx) => {
                  const uniqueIndex = `${categoryIdx}-${faqIdx}`;
                  const isOpen = openIndex === uniqueIndex;

                  return (
                    <div key={uniqueIndex} className="group">
                      <button
                        onClick={() => handleToggle(uniqueIndex)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:bg-gray-50"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 pr-4">
                          {faq.q}
                        </h3>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6">
                              <div className="text-gray-700 leading-relaxed">
                                {typeof faq.a === 'string' ? (
                                  <p>{faq.a}</p>
                                ) : (
                                  faq.a
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 bg-blue-50 rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help you get the most out of FlashQR.
          </p>
          <a
            href="mailto:contact.flashqr@gmail.com"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
