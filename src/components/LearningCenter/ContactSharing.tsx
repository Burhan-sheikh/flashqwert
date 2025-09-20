import React from "react";
import { motion } from "framer-motion";

const ContactSharing: React.FC = () => {
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
        Contact Sharing – Instantly Share Your Details
      </motion.h1>

      {/* Intro Paragraph */}
      <motion.p
        className="mt-2 text-sm md:text-md text-slate-700 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        FlashQR lets you create QR codes that share your contact information with
        a single scan. These Contact Sharing QR codes are perfect for business
        networking, events, or any situation where you want to share your
        details quickly and efficiently.
      </motion.p>

      {/* 1. What is a Contact Sharing QR Code? */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          1. What is a Contact Sharing QR Code?
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          A Contact Sharing QR code encodes information such as:
        </motion.p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>Name</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>Company or organization</li>
          <li>Website or social media profiles</li>
        </ul>
        <motion.p
          className="mt-2 text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          When someone scans your QR code, the information can be saved directly
          to their phone contacts, making sharing seamless and error-free.
        </motion.p>
        <motion.p
          className="mt-2 text-sm text-slate-700 max-w-3xl mx-auto italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Note: FlashQR generates static QR codes, so the information cannot be
          edited after creation. Make sure your details are correct before
          generating.
        </motion.p>
      </section>

      {/* 2. Why Use Contact Sharing QR Codes? */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          2. Why Use Contact Sharing QR Codes?
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Fast & Convenient</b> – Share all your essential details in one
            scan.
          </li>
          <li>
            <b>Professional Networking</b> – Ideal for business cards, email
            signatures, or event badges.
          </li>
          <li>
            <b>Error-Free Sharing</b> – Eliminates typos or missed details from
            manual entry.
          </li>
          <li>
            <b>Customizable & Branded</b> – Personalize the QR code with colors
            and logo to match your brand.
          </li>
          <li>
            <b>Reusable & Printable</b> – Add to business cards, flyers,
            brochures, or digital presentations.
          </li>
        </ul>
      </section>

      {/* 3. How to Create a Contact Sharing QR Code */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          3. How to Create a Contact Sharing QR Code
        </h2>
        <ul className="list-decimal list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Enter Your Details</b> – Fill in name, phone, email, and any
            additional information.
          </li>
          <li>
            <b>Customize Your QR Code</b> – Choose color, style, and optional
            branding.
          </li>
          <li>
            <b>Name Your QR Code</b> – Organize multiple codes in your FlashQR
            dashboard.
          </li>
          <li>
            <b>Download & Share</b> – Export the QR code to print on business
            cards or share digitally.
          </li>
        </ul>
      </section>

      {/* 4. Best Practices for Contact Sharing QR Codes */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          4. Best Practices for Contact Sharing QR Codes
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            Place QR codes where they are visible and easy to scan, such as
            business cards, email signatures, or social media profiles.
          </li>
          <li>Test the QR code with different devices before sharing.</li>
          <li>Keep your details concise to avoid overcrowding the QR code.</li>
          <li>
            Ensure high contrast between the QR code and background for better
            scannability.
          </li>
        </ul>
      </section>

      {/* 5. Use Cases */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          5. Use Cases
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Business Cards:</b> Replace traditional cards with a scannable QR
            code.
          </li>
          <li>
            <b>Networking Events:</b> Share your info instantly at conferences or
            meetups.
          </li>
          <li>
            <b>Email Signatures:</b> Include your QR code in digital
            communications for easy contact saving.
          </li>
          <li>
            <b>Marketing Materials:</b> Flyers, brochures, and posters with a
            quick access to your contact info.
          </li>
        </ul>
      </section>

      {/* 6. Key Considerations */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          6. Key Considerations
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            QR codes are static: the information cannot be changed after
            generation.
          </li>
          <li>
            Ensure the contact details are correct and up-to-date before
            creating the QR code.
          </li>
          <li>
            Use a short, professional URL if linking to an external profile or
            website.
          </li>
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
          href="/create" // replace with your create page route
          className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition text-sm"
        >
          Create Your Contact QR Code
        </a>
      </motion.div>
    </motion.div>
  );
};

export default ContactSharing;
