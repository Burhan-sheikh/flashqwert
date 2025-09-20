import React, { useEffect, useRef } from 'react';
import {
  ArrowRight,
  Gift,
  Zap,
  Rocket,
} from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
// Assuming these are local components, their imports are kept as is.
import AnimatedGenerateLine from '../components/AnimatedGenerateLine';
import ReviewsSection from '../components/ReviewsSection';
import HomeFAQ from '../components/homefaq';
import HowToUseSection from '../components/HowToUseSection';
import HeroSection from '../components/HeroSection'; //Import HeroSection

const PromoBanner = () => {
  const controls = useAnimation();
  const bannerRef = useRef(null);

  useEffect(() => {
    const animate = async () => {
      await controls.start({ x: 0, opacity: 1, transition: { duration: 0.5 } });
      await controls.start({ x: 5, transition: { duration: 0.3, repeat: 5, repeatType: "reverse" } });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animate();
          }
        });
      },
      { threshold: 0.6 } // Adjust the threshold as needed
    );

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => {
      if (bannerRef.current) {
        observer.unobserve(bannerRef.current);
      }
    };
  }, [controls]);

  return (
    <motion.div
      ref={bannerRef}
      initial={{ opacity: 0, x: -50 }}
      animate={controls}
      className="bg-gradient-to-r from-red-500 to-red-700 text-white py-6 rounded-xl shadow-md flex items-center justify-center space-x-4"
    >
      <Gift className="w-8 h-8" />
      <p className="text-sm md:text-2xl font-semibold">
        Sign up and get 30 FREE quota!
      </p>
      <Gift className="w-8 h-8" />
    </motion.div>
  );
};

const LogOutHome = () => {
  return (
    <div className="text-slate-900 bg-transparent antialiased overflow-x-hidden">


{/* Promo Banner Section */}
<section className="mb-8 mt-2">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <a href="/signup">
      <PromoBanner />
    </a>
  </div>
</section>
      

      {/* Reviews Section */}
      <ReviewsSection />

      
     
      {/* Advanced Animation Section */}
      <div className="mt-2">
        <AnimatedGenerateLine animationType="advanced" margin="px-4" duration={4.5} showProgress={true} />
      </div>

      {/* What We Offer Section (now includes Features Section) */}
      <HowToUseSection />

      {/* Final CTA */}
<section className="px-4 py-10">
  <div className="mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

      <div className="relative">
        <Rocket className="w-12 h-12 mx-auto mb-4" />
        <h2 className="font-bold text-3xl md:text-4xl mb-4 text-center">
          Ready to Create Your First QR Code?
        </h2>
        <p className="mb-8 text-lg opacity-90 text-center max-w-md mx-auto">
          Sign up and get 30 FREE QR codes!
        </p>

       <div className="flex justify-center items-center gap-1 sm:gap-4 mb-6 flex-wrap">
  {/* Sign Up Button */}
  <a
    href="/signup"
    className="bg-white text-blue-600 font-semibold px-6 py-2 sm:px-8 sm:py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-blue-50 hover:shadow-xl transition-all duration-300 group text-sm sm:text-base"
  
  >
    Sign up
    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
  </a>

  {/* Plans & Pricing Link */}
  <a
    href="/plans-and-quota"
    className="text-white font-medium hover:underline underline-offset-4 transition-colors duration-200 text-sm sm:text-base"
  >
    Plans & Pricing
  </a>
</div>

              {/* Single QR Animation */}
              <div className="mb-2">
                <AnimatedGenerateLine animationType="single" margin="px-4" duration={2.0} showProgress={true} />
              </div>
            </div>
          </motion.div>

          

          {/* FAQ Section */}
<HomeFAQ />
</div>
</section>


</div>
);
};

export default LogOutHome;

