import React, { useRef, useEffect, useMemo } from 'react';
import { QrCode, Download, FileImage, FileText } from 'lucide-react';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';

export interface AnimatedGenerateLineProps {
  animationType?: 'single' | 'multi' | 'pdf' | 'collections' | 'offerings' | 'corevalues' | 'advanced';
  margin?: string;
  duration?: number;
  showProgress?: boolean;
  onComplete?: () => void;
}

const AnimatedGenerateLine: React.FC<AnimatedGenerateLineProps> = ({
  animationType,
  margin = 'my-8 px-4',
  duration = 2.5,
  showProgress = true,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const inView = useInView(containerRef, {
    once: false,
    amount: 0.3,
  });

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.15,
      },
    },
  }), []);

  const progressVariants = useMemo(() => ({
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: {
        duration: duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }), [duration]);

  const iconVariants = useMemo(() => ({
    initial: { scale: 0, opacity: 0 },
    animate: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
  }), []);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration * 1000);
      return () => clearTimeout(timer);
    } else {
      controls.start('hidden');
    }
  }, [inView, controls, duration, onComplete]);

  // Single QR Animation - Clean and Professional
  return (
    <motion.div
      ref={containerRef}
      className={`relative flex items-center justify-center w-full bg-blue-50 rounded-xl shadow-md ${margin}`}
      style={{ minHeight: 'auto' }}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
    >
      <div className="relative px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
        <motion.div
          className="flex items-center gap-3 sm:gap-4 md:gap-6"
          initial="hidden"
          animate="visible"
        >
          {/* QR Icon */}
          <motion.div variants={iconVariants} custom={0}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <QrCode className="w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 text-white" />
            </div>
          </motion.div>

          {/* Download + Formats */}
          <motion.div className="flex items-center gap-2 sm:gap-3 md:gap-4" variants={iconVariants} custom={0.4}>
            <Download className="w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 text-blue-500" />
            <AnimatePresence>
              <motion.div
                key="formats"
                className="flex items-center gap-1 sm:gap-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, staggerChildren: 0.1 }}
              >
                {/* PNG */}
                <motion.div
                  className="flex items-center gap-1 bg-green-200 px-2 py-1 rounded-md"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <FileImage className="w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 text-green-600" />
                  <span className="text-xs font-medium text-green-700">PNG</span>
                </motion.div>
                {/* JPG */}
                <motion.div
                  className="flex items-center gap-1 bg-orange-200 px-2 py-1 rounded-md"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <FileImage className="w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">JPG</span>
                </motion.div>
                {/* PDF */}
                <motion.div
                  className="flex items-center gap-1 bg-red-200 px-2 py-1 rounded-md"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16 text-red-700" />
                  <span className="text-xs font-medium text-red-700">PDF</span>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnimatedGenerateLine;
