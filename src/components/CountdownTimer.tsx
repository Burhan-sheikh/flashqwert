import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, ArrowRight } from 'lucide-react';

interface CountdownTimerProps {
  duration: number; // seconds
  onComplete: () => void;
  onSkip?: () => void;
  title?: string;
  description?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  duration,
  onComplete,
  onSkip,
  title = "Redirecting...",
  description = "You will be redirected automatically"
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
        <Timer className="w-10 h-10 text-blue-600" />
        
        {/* Circular progress */}
        <svg className="absolute inset-0 w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-blue-200"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-blue-600"
            strokeDasharray={`${2 * Math.PI * 36}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 36 * (1 - progress / 100) }}
            transition={{ duration: 0.5 }}
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="text-4xl font-bold text-blue-600 mb-2">{timeLeft}</div>
        <p className="text-sm text-blue-700">seconds remaining</p>
      </div>

      {onSkip && (
        <button
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Skip Countdown
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default CountdownTimer;