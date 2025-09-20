import React from 'react';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "What is FlashQR?",
    answer:
      "FlashQR is a fast, user-friendly platform that lets you generate high-quality QR codes from any URL—instantly and without distractions."
  },
  {
    question: "Do I need to sign up to use FlashQR?",
    answer:
      "Yes, signing up is required to access your free quota and start generating QR codes."
  },
  {
    question: "How many QR codes can I generate after signing up?",
    answer:
      "After signing up, free users can generate up to 30 QR codes and can store them in 1 collection. If you need to create more, you can upgrade to Basic (300 QR codes, 10 collections), Standard (900 QR codes, 30 collections), or Premium (1,500 QR codes, 50 collections, bulk generation). You can also purchase additional quota while keeping your current plan features."
  },
  {
    question: "What types of QR codes can I create?",
    answer: "FlashQR currently supports static QR codes for URLs. Support for additional types is coming soon."
  },
  {
    question: "Can I edit a QR code after creating it?",
    answer: "No, QR codes are final once created. If you need changes, you'll need to generate a new one."
  },
  {
    question: "Are the QR codes permanent?",
    answer: "Yes, All static QR codes generated on FlashQR are permanent and can be used indefinitely."
  },
  {
    question: "Do exports include QR code names or labels?",
    answer: "Yes, when exporting to PDF, each QR code is displayed along with its assigned name for easy identification."
  },
  {
    question: "Is my data safe on FlashQR?",
    answer: "Absolutely, Your QR codes and collections are securely stored in the cloud using trusted infrastructure."
  },
  {
  question: "Will I lose my saved QR codes if I downgrade from Premium to the Free plan?",
  answer:
    "No, your existing QR codes remain safe. However, you'll be limited to Free plan features: 30 QR codes in history storage and 1 collection. Additional QR codes and collections will be temporarily inaccessible until you upgrade again."
},
  {
    question: "What are the benefits of a Premium subscription?",
    answer: "Premium users get up to 1,500 QR codes, bulk generation, up to 50 collections, advanced export features, priority support, and 4,500 QR codes in history storage."
  }
];

const HomeFAQ = () => (
  <section className="py-16" id="faq">
    <div className="max-w-3xl mx-auto px-4">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-blue-100">
          <HelpCircle className="text-blue-600 w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight">Frequently Asked Questions</h2>
        <p className="mt-4 text-sm sm:text-sm md:text-lg max-w-xl mx-auto">Got questions? We’ve got answers.</p>
      </div>
      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div key={idx} className="rounded-lg bg-white shadow-sm p-5 border border-gray-100 transition hover:shadow-md">
            <p className="font-semibold text-gray-900 mb-1">{faq.question}</p>
            <p className="text-gray-700 text-sm">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HomeFAQ;
