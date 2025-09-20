// src/components/LearningCenter/Packaging.tsx
import React from "react";
import { motion } from "framer-motion";

const Packaging: React.FC = () => {
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
        Packaging with FlashQR – Complete Guide
      </motion.h1>

      {/* Intro Paragraph */}
      <motion.p
        className="mt-2 text-sm md:text-md text-slate-700 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        FlashQR makes it simple to create professional static QR codes that can be
        printed directly on your product packaging. These QR codes help your
        customers access important information quickly, enhancing the product
        experience and building brand trust.
      </motion.p>

      {/* 1. What is Packaging QR Code? */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          1. What is Packaging QR Code?
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          A Packaging QR Code is a QR code placed on product packaging to provide
          instant access to online resources. With FlashQR, the QR codes are
          static, meaning the URL or information encoded cannot be changed after
          creation. This makes them reliable, permanent, and ready for printing.
        </motion.p>
        <motion.p
          className="mt-2 text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Use cases include:
        </motion.p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>Product websites or landing pages</li>
          <li>Instruction manuals or user guides</li>
          <li>Social media profiles</li>
          <li>Promotional campaigns</li>
          <li>Warranty registration pages</li>
        </ul>
      </section>

      {/* 2. Why Use Static QR Codes for Packaging? */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          2. Why Use Static QR Codes for Packaging?
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Even though they are static, QR codes are highly effective for packaging
          because they:
        </motion.p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Provide Instant Access</b> – Customers can scan and reach your link
            immediately.
          </li>
          <li>
            <b>Enhance Brand Experience</b> – Share your brand story, offers, or
            tutorials.
          </li>
          <li>
            <b>Maintain Professional Look</b> – FlashQR lets you customize the color
            and style of your QR codes to match your packaging design.
          </li>
          <li>
            <b>Reliable and Permanent</b> – Static QR codes never expire and don’t
            require subscriptions.
          </li>
          <li>
            <b>Cost-Effective</b> – Print once, use forever—perfect for bulk
            production.
          </li>
          <li>
            <b>Easy to Implement</b> – No technical expertise required; once
            generated, the QR code is ready to use.
          </li>
        </ul>
        <motion.p
          className="mt-2 text-sm text-slate-700 max-w-3xl mx-auto italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Note: Unlike dynamic QR codes, static QR codes cannot be edited after
          creation. Make sure the link you embed is stable and permanent.
        </motion.p>
      </section>

      {/* 3. Examples of QR Code Use on Packaging */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          3. Examples of QR Code Use on Packaging
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Food & Beverage:</b> Link to nutrition info, recipes, or your website.
          </li>
          <li>
            <b>Cosmetics:</b> Tutorials, product tips, or social media profiles.
          </li>
          <li>
            <b>Electronics:</b> User manuals, setup guides, or warranty info.
          </li>
          <li>
            <b>Fashion & Accessories:</b> Care instructions, style guides, or online
            catalogs.
          </li>
        </ul>
      </section>

      {/* 4. How to Create a Packaging QR Code with FlashQR */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          4. How to Create a Packaging QR Code with FlashQR
        </h2>
        <ul className="list-decimal list-inside space-y-1 text-slate-700 text-sm ml-6">
           <li>
            <b>Name Your QR Code</b> – Enter the name or label for your QR code.
          </li>
          <li>
            <b>Enter the URL</b> – Input the link you want your customers to visit.
          </li>
          <li>
            <b>Customize the QR Code</b> – Adjust colors, and upload logo.
          </li>
         
          <li>
            <b>Download and Print</b> – Export the QR code in high resolution for
            packaging.
          </li>
        </ul>
        <motion.p
          className="mt-2 text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Tip: Ensure your QR code is printed with sufficient size and contrast for
          easy scanning.
        </motion.p>
      </section>

      {/* 5. Best Practices for Packaging QR Codes */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          5. Best Practices for Packaging QR Codes
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>Place the QR code in a visible area on the packaging.</li>
          <li>Maintain high contrast between the QR code and background.</li>
          <li>Test the QR code with multiple devices before printing.</li>
          <li>Avoid placing QR codes near folds, edges, or curved surfaces.</li>
          <li>Keep URLs short and permanent to reduce scanning errors.</li>
        </ul>
      </section>

      {/* 6. Benefits Summary */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          6. Benefits Summary
        </h2>
        <table className="w-full text-sm text-left text-slate-700">
          <thead className="text-xs text-slate-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-2 px-3">
                Benefit
              </th>
              <th scope="col" className="py-2 px-3">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white border-b">
              <th scope="row" className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                Instant Access
              </th>
              <td className="py-2 px-3">Customers scan to get information immediately</td>
            </tr>
            <tr className="bg-white border-b">
              <th scope="row" className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                Brand Engagement
              </th>
              <td className="py-2 px-3">Share stories, offers, or tutorials directly</td>
            </tr>
            <tr className="bg-white border-b">
              <th scope="row" className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                Professional Design
              </th>
              <td className="py-2 px-3">Customizable colors and styles to match packaging</td>
            </tr>
            <tr className="bg-white border-b">
              <th scope="row" className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                Reliable
              </th>
              <td className="py-2 px-3">Permanent and no ongoing subscription required</td>
            </tr>
            <tr className="bg-white border-b">
              <th scope="row" className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                Cost-Effective
              </th>
              <td className="py-2 px-3">Print once and use forever</td>
            </tr>
            <tr className="bg-white">
              <th scope="row" className="py-2 px-3 font-medium text-slate-900 whitespace-nowrap">
                Easy Implementation
              </th>
              <td className="py-2 px-3">No technical knowledge needed</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 7. Key Considerations */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          7. Key Considerations
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>QR codes are static and cannot be edited after generation.</li>
          <li>Choose URLs that are stable and unlikely to change.</li>
          <li>Ensure high print quality to maintain scannability.</li>
        </ul>
      </section>

      {/* CTA Button */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <a
          href="/generate" // replace with your create page route
          className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition text-sm"
        >
          Create Your Packaging QR Code
        </a>
      </motion.div>
    </motion.div>
  );
};

export default Packaging;
