import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  FaStore, FaChartBar, FaTicketAlt, FaBuilding, FaBriefcase, FaStar, FaArrowRight, FaCheck, FaRocket
} from 'react-icons/fa';
import { Link } from 'react-router-dom'; // Import Link from React Router

// Animation Variants
const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] } } };
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6 } } };
const slideInLeft = { hidden: { opacity: 0, x: -50 }, show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } } };
const slideInRight = { hidden: { opacity: 0, x: 50 }, show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } } };
const stagger = { show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { duration: 0.6, type: 'spring', bounce: 0.4 } } };

// Reusable Components
const Section = ({ id, className, children }) => (
  <section id={id} className={`w-full overflow-hidden ${className || ''}`}>{children}</section>
);

const Heading = ({ title, subtitle }) => (
  <motion.div
    className="mx-auto max-w-4xl text-center py-8"
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.3 }}
    variants={stagger}
  >
    <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p variants={fadeUp} className="mt-4 text-xl text-slate-600 leading-relaxed">
        {subtitle}
      </motion.p>
    )}
    <motion.div variants={fadeUp} className="mt-6 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto" />
  </motion.div>
);

const StoryBlock = () => (
  <Section className="py-12">
    <Heading
      title="Why FlashQR Exists"
      subtitle="Simplicity. Organization. Clean exports."
    />
    <motion.div
      className="flex flex-col items-center justify-center gap-10 mt-6"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={stagger}
    >
      <motion.div variants={fadeUp} className="max-w-xl text-lg text-center text-slate-700">
        While other tools overwhelm you with endless design options, <b>FlashQR</b> focuses on simplicity, organization, and professional outputs. From entrepreneurs to startups, FlashQR empowers users to generate, manage, and share QR codes efficiently.
      </motion.div>
    </motion.div>
  </Section>
);

const UseCasesList = () => {
  const useCases = [
    {
      title: 'Interactive Packaging',
      text: 'Turn product packaging into an interactive touchpoint with scannable content, manuals, and promotions.',
      imageAlt: 'Packaging Box',
      imageSrc: 'https://res.cloudinary.com/dlesei0kn/image/upload/packaging-image_uv07ud.png',
      tag: 'Retail',
      link: '/learning-center/packaging', // Add the link here
    },
    {
      title: 'Instant Contact Sharing',
      text: 'Share contact details instantly on business cards, email signatures, or displays with a single scan.',
      imageAlt: 'Business Card',
      imageSrc: 'https://res.cloudinary.com/dlesei0kn/image/upload/card-image_1_fsosfn.png',
      tag: 'Networking',
      link: '/learning-center/contact-sharing', // Add the link here
    },
    {
      title: 'Seamless Web Integration',
      text: 'Embed QR codes into landing pages and blogs for quick actions like sign-ups and downloads.',
      imageAlt: 'Website / Browser Window',
      imageSrc: 'https://res.cloudinary.com/dlesei0kn/image/upload/website-image_3_xqkptl.png',
      tag: 'Web',
      link: '/learning-center/web-integration', // Placeholder link
    },
    {
      title: 'App Downloads',
      text: 'Drive app installs directly from print, packaging, or screens with deep links and tracking.',
      imageAlt: 'App Download',
      imageSrc: 'https://res.cloudinary.com/dlesei0kn/image/upload/download-app-image_4_db9geq.png',
      tag: 'Mobile',
      link: '/learning-center/app-download', // Placeholder link
    },
    {
      title: 'Contactless Entry',
      text: 'Enable secure, contactless event check-ins and ticket validation with QR-based passes.',
      imageAlt: 'Event Ticket',
      imageSrc: 'https://res.cloudinary.com/dlesei0kn/image/upload/event-image_5_kg1g1t.png',
      tag: 'Events',
      link: '/learning-center/contactless-entry', // Placeholder link
    },
  ];

  return (
    <Section className="py-12 sm:py-16">
      <Heading title="Versatile Uses of FlashQR" subtitle="Explore the possibilities" />

      {/* Mobile grid (cards) */}
      <motion.ul
        className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 sm:grid-cols-2 lg:hidden"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        {useCases.map((useCase, index) => (
          <motion.li
            key={index}
            variants={scaleIn}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg focus-within:shadow-lg"
          >
            <div className="relative">
              <img
                src={useCase.imageSrc}
                alt={useCase.imageAlt}
                className="h-48 w-full object-contain bg-slate-50"
                loading="lazy"
              />
              <span className="absolute left-4 top-4 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {useCase.tag}
              </span>
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-5"
                   style={{ background: 'radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), #6366f1 0%, transparent 40%)' }} />
            </div>

            <div className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">{useCase.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{useCase.text}</p>
              <Link // Use React Router's Link component
                to={useCase.link}
                className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg"
                onMouseMove={(e) => {
                  const target = e.currentTarget.parentElement?.previousElementSibling as HTMLElement | null;
                  if (!target) return;
                  const rect = target.getBoundingClientRect();
                  target.style.setProperty('--x', `${e.clientX - rect.left}px`);
                  target.style.setProperty('--y', `${e.clientY - rect.top}px`);
                }}
              >
                Learn more
                <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      {/* Desktop alternating media layout */}
      <motion.ul
        className="mx-auto hidden max-w-6xl flex-col gap-12 px-6 lg:flex"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        {useCases.map((useCase, index) => {
          const isEven = index % 2 === 0;
          return (
            <motion.li
              key={index}
              variants={fadeUp}
              className="relative flex items-center gap-10"
            >
              <div className={`relative w-1/2 ${isEven ? '' : 'order-2'}`}>
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <img
                    src={useCase.imageSrc}
                    alt={useCase.imageAlt}
                    className="h-[320px] w-full object-contain bg-slate-50"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_circle_at_20%_20%,rgba(99,102,241,0.08),transparent_40%)]" />
                </div>
                <span className="absolute -top-3 left-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  {useCase.tag}
                </span>
              </div>

              <div className={`w-1/2 ${isEven ? '' : 'order-1'}`}>
                <motion.h3
                  variants={slideInLeft}
                  className="text-2xl font-bold tracking-tight text-slate-900"
                >
                  {useCase.title}
                </motion.h3>
                <motion.p
                  variants={fadeIn}
                  className="mt-3 text-lg text-slate-600 leading-relaxed"
                >
                  {useCase.text}
                </motion.p>
                <Link // Use React Router's Link component
                  to={useCase.link}
                  className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg mt-4"
                >
                  Learn more
                  <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </Section>
  );
};

const About = ({ isLoggedIn = false }) => {
  return (
    <main className="w-full relative">
     {/* HERO SECTION */}
<Section id="hero" className="relative">
  <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 sm:py-4 lg:px-8">
    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
      {/* Text */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="text-center lg:text-left flex-1">
        <motion.h1 variants={slideInLeft} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent leading-tight">
          About FlashQR
        </motion.h1>
        <motion.p variants={slideInLeft} className="mt-4 sm:mt-6 text-lg sm:text-xl leading-relaxed text-slate-700 max-w-full lg:max-w-2xl">
          FlashQR exists to simplify QR code management. Our mission is to make QR code creation effortless, organized, and professional. Name, customize, logo, and export—all in seconds.
        </motion.p>
      </motion.div>
      {/* QR Code Mockup */}
      <motion.div
        className="flex items-center justify-center relative flex-1"
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.3, type: 'spring', bounce: 0.3 }}
      >
        <motion.div
          className="relative rounded-3xl p-6 sm:p-8 bg-white border-2 border-blue-400 shadow-[0\_0\_10px\_rgba(59,130,246,0.4)]"
          whileHover={{ scale: 1.05, rotate: 2, transition: { duration: 0.3 } }}
        >
          <QRCodeSVG
            value="https://flashqr.netlify.app"
            size={200} // smaller on mobile
            bgColor="transparent"
            fgColor="#1e293b"
            level="Q"
            className="rounded-2xl"
          />
          <div className="mt-4 text-center text-sm sm:text-base text-slate-500 font-medium">
            [https://flashqr.netlify.app]
          </div>
        </motion.div>
      </motion.div>
    </div>
  </div>
</Section>
      
      
      {/* CREATE IN STEPS */}
      <Section id="steps" className="relative">
        <div className="relative z-10 max-w-7xl mx-auto mt-8 px-6 py-8 sm:py-8 lg:px-8">
          <Heading title="Create QR Codes in Simple Steps" />
          <motion.div
            className="mx-auto mt-4 grid gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            {[
              { title: 'Enter Details', description: 'QR code name & the URL.', illustration: 'https://illustrations.popsy.co/blue/work-from-home.svg', color: 'from-blue-500 to-indigo-600' },
              { title: 'Customize', description: 'Pick colors, error correction, & upload your logo.', illustration: 'https://illustrations.popsy.co/blue/graphic-design.svg', color: 'from-purple-500 to-pink-600' },
              { title: 'Generate & Export', description: 'Download PNG, JPG, PDF.', illustration: 'https://res.cloudinary.com/dlesei0kn/image/upload/v1755428765/Untitled\_design\_nbtqpo.png', color: 'from-green-500 to-emerald-600' },
            ].map((item, index) => (
              <motion.div key={index} variants={scaleIn} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500" />
                <div className="relative flex flex-col items-center p-8 text-center h-full">
                  <img
                    src={item.illustration}
                    alt={item.title}
                    className="w-24 h-24 mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{ objectFit: 'contain' }}
                  />
                  <div className="absolute top-4 left-6 text-6xl font-black text-slate-100 group-hover:text-slate-200 transition-colors">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 relative z-10">
                    Step {index + 1}: {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed relative z-10">
                    {item.description}
                  </p>
                  
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>
      {/* WHO USES FLASHQR */}
      <Section id="who-uses" className="px-6 py-8 lg:px-8">
        <Heading title="Who Uses FlashQR?" />
        <motion.div
          className="mx-auto mt-4 max-w-6xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { icon: FaBriefcase, label: 'Entrepreneurs', color: 'from-blue-500 to-cyan-500' },
              { icon: FaStore, label: 'Small Businesses', color: 'from-green-500 to-emerald-500' },
              { icon: FaRocket, label: 'Startups', color: 'from-purple-500 to-violet-500' },
              { icon: FaTicketAlt, label: 'Event Organizers', color: 'from-pink-500 to-rose-500' },
              { icon: FaChartBar, label: 'Marketers', color: 'from-orange-500 to-red-500' },
              { icon: FaStore, label: 'Restaurants & Cafés', color: 'from-yellow-500 to-amber-500' },
            ].map(({ icon: Icon, label, color }) => (
              <motion.div key={label} variants={scaleIn} className="group flex flex-col items-center text-center">
                <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${color} shadow-lg mb-4 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 flex items-center justify-center`}>
                  <Icon className="text-white text-2xl" />
                  <div className="absolute inset-0 rounded-2xl bg-white/20 group-hover:bg-white/30 transition-colors" />
                </div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Why FlashQR Section (Story Block) */}
      <StoryBlock />
      {/* Use Cases List */}
      <UseCasesList />
      
      {/* FINAL CTA SECTION */}
      <Section id="cta" className="px-6 py-24 text-center bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.03'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
        <motion.div
          className="relative z-10"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.h3 variants={fadeUp} className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Ready to Transform Your QR Workflow?
          </motion.h3>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-3xl text-xl text-slate-300 leading-relaxed">
            Join thousands of users and start creating branded QR codes instantly.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex justify-center gap-6 flex-wrap">
            <a
              href="/plans-and-quota"
              className="inline-flex items-center rounded-xl px-10 py-5 text-lg font-semibold text-white ring-2 ring-white/30 bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:ring-white/50"
            >
              View Pricing
            </a>
          </motion.div>
        </motion.div>
      </Section>
    </main>
  );
};

export default About;
