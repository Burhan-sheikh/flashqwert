import React from "react";
import { motion } from "framer-motion";

const AppDownload: React.FC = () => {
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
        App Download – Share Apps with QR Codes (Static)
      </motion.h1>

      {/* Intro Paragraph */}
      <motion.p
        className="mt-2 text-sm md:text-md text-slate-700 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        FlashQR helps you create static QR codes that link directly to your app
        store page. Users can scan once and be taken instantly to your app’s
        download link — no searching required.
      </motion.p>

      {/* 1. What is an App Download QR Code? */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          1. What is an App Download QR Code?
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          An App Download QR Code encodes a direct link to your app’s page on
          the Google Play Store or Apple App Store. When someone scans the code,
          they’re redirected straight to the download page. Since FlashQR
          creates static QR codes, the link cannot be changed later.
        </motion.p>
      </section>

      {/* 2. Why Use QR Codes for App Downloads? */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          2. Why Use QR Codes for App Downloads?
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Frictionless installs</b> – Users don’t need to search for your app
            manually.
          </li>
          <li>
            <b>Cross-channel sharing</b> – Works across flyers, posters, product
            packaging, and websites.
          </li>
          <li>
            <b>One-time setup</b> – Generate once, print anywhere, and it will
            always lead to your app.
          </li>
          <li>
            <b>Boost adoption</b> – Makes it simple for customers to try your
            app.
          </li>
        </ul>
      </section>

      {/* 3. How to Create an App Download QR Code */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          3. How to Create an App Download QR Code
        </h2>
        <ul className="list-decimal list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>Copy your app’s Google Play Store or Apple App Store URL.</li>
          <li>Paste it into FlashQR’s QR generator.</li>
          <li>Customize colors and style to match your brand.</li>
          <li>Name and save the QR code in a collection.</li>
          <li>Download and use in your marketing.</li>
        </ul>
      </section>

      {/* 4. Best Practices */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          4. Best Practices
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            Create separate QR codes for Android and iOS apps if you have both.
          </li>
          <li>
            Use clear labels like “Download on Google Play” or “Get it on the
            App Store” next to your QR code.
          </li>
          <li>Test the QR code on multiple devices before sharing.</li>
          <li>
            Place QR codes in high-visibility areas like banners, posters,
            product inserts, and websites.
          </li>
        </ul>
      </section>

      {/* 5. Example Use Cases */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          5. Example Use Cases
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>Mobile game promotion on posters or billboards</li>
          <li>Retail packaging directing users to your loyalty app</li>
          <li>Event flyers encouraging attendees to download your event app</li>
          <li>Website banners with QR codes for instant installs</li>
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
          App Download QR codes are a fast and reliable way to drive installs.
          With FlashQR’s static QR codes, your users will always be taken to
          the same app store page — making it perfect for permanent marketing
          campaigns.
        </motion.p>
      </section>
    </motion.div>
  );
};

export default AppDownload;
