import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, QrCode } from "lucide-react";

/**
 * ScanPrintAnimation
 * Props:
 * - onComplete: function called after the animation finishes (~3s)
 */
const ScanPrintAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState<"scanning" | "printing" | "paper" | "done">("scanning");

  // Handle phase transitions
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    t1 = setTimeout(() => setPhase("printing"), 1700); // 1.7 sec scanning
    t2 = setTimeout(() => setPhase("paper"), 2700);    // 1 sec printing
    t3 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3300); // 0.6 sec paper out

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // Simple QR illustration for animation (replace as needed with your QR)
  const QR = (
    <div className="relative w-28 h-28 mx-auto bg-white rounded-md border border-gray-200 overflow-hidden flex items-center justify-center">
      <QrCode className="w-20 h-20 text-gray-900" />
      {/* Moving scanner (laser line) */}
      {phase === "scanning" && (
        <motion.div
          className="absolute left-0 w-full h-1 bg-green-500/80"
          initial={{ top: 0 }}
          animate={{ top: "92%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {phase === "scanning" && (
        <motion.div
          key="scan"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="flex flex-col items-center text-center py-5"
        >
          <div className="mb-2 text-lg font-semibold">Scanning QR Code...</div>
          {QR}
        </motion.div>
      )}
      {phase === "printing" && (
        <motion.div
          key="print"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="flex flex-col items-center text-center py-5"
        >
          <div className="mb-2 text-lg font-semibold">Printing QR Code...</div>
          <motion.div
            className="relative"
            initial={{ y: 0 }}
            animate={{ y: 68 }} // QR slides into printer
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            {QR}
            <Printer className="absolute left-1/2 -translate-x-1/2 top-24 w-14 h-14 text-gray-700" />
          </motion.div>
        </motion.div>
      )}
      {phase === "paper" && (
        <motion.div
          key="paper"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="flex flex-col items-center text-center py-5"
        >
          <div className="mb-2 text-lg font-semibold">Finishing Up...</div>
          <div className="relative h-28 w-32 flex items-end justify-center">
            {/* Simple "paper" effect */}
            <motion.div
              className="absolute bottom-0 w-20 h-20 bg-white shadow-md rounded-b-lg border-t-4 border-green-500"
              initial={{ y: 45, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.34 }}
            ></motion.div>
            <Printer className="absolute left-1/2 -translate-x-1/2 bottom-14 w-14 h-14 text-gray-700" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScanPrintAnimation;
