import React from "react";
import { motion } from "framer-motion";

const ContactlessEntry: React.FC = () => {
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
        Contactless Entry – Seamless Access with Static QR Codes
      </motion.h1>

      {/* Intro Paragraph */}
      <motion.p
        className="mt-2 text-sm md:text-md text-slate-700 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        FlashQR allows you to create static QR codes for fast, touch-free
        entry. Whether for events, offices, or private spaces, QR codes reduce
        physical contact while keeping the process simple.
      </motion.p>

      {/* 1. What is a Contactless Entry QR Code? */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          1. What is a Contactless Entry QR Code?
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          A Contactless Entry QR Code contains a fixed link or code that
          people scan to gain access. Since FlashQR generates static QR codes,
          once created, the access link or text remains the same. Ideal for
          one-time or recurring use where the entry process doesn’t require
          frequent changes.
        </motion.p>
      </section>

      {/* 2. Benefits of Contactless Entry */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          2. Benefits of Contactless Entry
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            <b>Touch-free access</b> – Eliminates the need for physical tickets
            or passes.
          </li>
          <li>
            <b>Quick scanning</b> – Faster check-ins compared to manual
            verification.
          </li>
          <li>
            <b>Cost-effective</b> – Print once, reuse for multiple events or
            locations.
          </li>
          <li>
            <b>Professional experience</b> – Adds convenience and modern appeal.
          </li>
        </ul>
      </section>

      {/* 3. How to Use QR Codes for Entry */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          3. How to Use QR Codes for Entry
        </h2>
        <ul className="list-decimal list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            Choose your entry method – Decide if your QR code links to an info
            page, a registration form, or simply displays a text passcode.
          </li>
          <li>
            Generate your QR code in FlashQR with the desired URL or text.
          </li>
          <li>
            Print or display digitally – Add it to posters, tickets, or entry
            signage.
          </li>
          <li>
            Verify scans – Staff/security can check the scan output for access
            confirmation.
          </li>
        </ul>
      </section>

      {/* 4. Limitations of Static QR Codes */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          4. Limitations of Static QR Codes
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Static QR codes cannot track usage (e.g., who scanned or how many
          times). The code cannot be revoked or updated after it’s shared. For
          high-security or single-use entry, dynamic QR systems (not supported
          in FlashQR) are more suitable.
        </motion.p>
      </section>

      {/* 5. Best Practices */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          5. Best Practices
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            Use clear instructions like “Scan to Enter” beside your QR code.
          </li>
          <li>Place codes at eye level for easy scanning.</li>
          <li>Combine with ID verification for higher-security events.</li>
          <li>Print in large, scannable sizes for quick use at gates.</li>
        </ul>
      </section>

      {/* 6. Example Use Cases */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          6. Example Use Cases
        </h2>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm ml-6">
          <li>
            Event halls – Guests scan to access an event schedule or entry pass.
          </li>
          <li>
            Office receptions – Visitors scan to fill out a check-in form.
          </li>
          <li>
            Private gatherings – Share a static entry pass with invitees.
          </li>
          <li>
            Public facilities – Touch-free access to info or maps at entry
            points.
          </li>
        </ul>
      </section>

      {/* 7. Summary */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          7. Summary
        </h2>
        <motion.p
          className="text-sm text-slate-700 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Contactless Entry with FlashQR provides a simple, hygienic, and
          efficient way to manage access. While static QR codes are not suited
          for advanced security tracking, they’re perfect for basic entry
          passes, event signage, and touch-free visitor experiences.
        </motion.p>
      </section>
    </motion.div>
  );
};

export default ContactlessEntry;
