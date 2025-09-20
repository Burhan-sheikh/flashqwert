import React from "react";
import { motion } from "framer-motion";

const WebIntegration: React.FC = () => {
  return (
    <motion.div
      className="min-h-screen bg-white py-8 px-4 md:px-10 lg:px-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Heading */}
      <motion.h1
        className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Web Integration – Connect Your QR Codes to the Web (Static QR)
      </motion.h1>

      {/* Intro Paragraph */}
      <motion.p
        className="mt-2 text-sm md:text-md text-slate-700 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        FlashQR allows you to create static QR codes that link directly to your
        website, landing page, or online content. Once generated, the QR code
        is permanent and cannot be changed, making it ideal for reliable,
        one-time print or distribution.
      </motion.p>

      {/* 1. What is Web Integration with Static QR Codes? */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          1. What is Web Integration with Static QR Codes?
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Static QR codes encode a fixed URL. When scanned, users are directed
          to that link every time. Unlike dynamic QR codes, the URL cannot be
          updated later, so it’s important to double-check your link before
          generating.
        </motion.p>
        <motion.p
          className="mt-2 text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Use cases:
        </motion.p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>Direct users to a product page or catalog</li>
          <li>Share your business website</li>
          <li>Link to an online registration form or event page</li>
          <li>Promote a social media profile</li>
        </ul>
      </section>

      {/* 2. Why Use Static QR Codes for Web Integration? */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          2. Why Use Static QR Codes for Web Integration?
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Permanent & Reliable</b> – Once generated, your QR code will
            always point to the same URL.
          </li>
          <li>
            <b>Cost-Effective</b> – Print once and reuse indefinitely without
            subscription fees.
          </li>
          <li>
            <b>Fast & Simple</b> – Ideal for offline marketing like flyers,
            posters, packaging, or business cards.
          </li>
          <li>
            <b>Professional Look</b> – Customize colors and style to match your
            brand.
          </li>
        </ul>
      </section>

      {/* 3. How to Create a Static Web QR Code */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          3. How to Create a Static Web QR Code
        </h2>
        <ul className="list-decimal list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>Enter the URL you want to share.</li>
          <li>
            Customize the QR code’s colors, design, or logo to match your
            branding.
          </li>
          <li>Name your QR code for easy organization in your dashboard.</li>
          <li>Download and share digitally or print on physical materials.</li>
        </ul>
      </section>

      {/* 4. Best Practices */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          4. Best Practices
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Verify the URL before generating</b> – static QR codes cannot be
            edited.
          </li>
          <li>Use short, stable links for reliability.</li>
          <li>Ensure high contrast for scannability.</li>
          <li>Test on multiple devices and browsers before printing.</li>
          <li>
            Place the QR code in visible, flat areas to make scanning easy.
          </li>
        </ul>
      </section>

      {/* 5. Example Use Cases */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          5. Example Use Cases
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>Marketing flyers or posters</li>
          <li>Event tickets or schedules</li>
          <li>Product catalogs and brochures</li>
          <li>Social media profile cards</li>
        </ul>
      </section>

      {/* 6. Summary */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          6. Summary
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Even though the QR code is static, it is a fast, professional, and
          reliable way to connect offline audiences to your online content.
          FlashQR makes it easy to create, customize, and distribute these codes
          in seconds.
        </motion.p>
      </section>
    </motion.div>
  );
};

export default WebIntegration;
