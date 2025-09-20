import React from 'react';
import FeaturesSection from './FeaturesSection';

interface Slide {
  imageUrl: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    imageUrl: "https://res.cloudinary.com/dlesei0kn/image/upload/v1753800084/20250601_011841_0000_rwskf2.png",
    title: "Generate Static QR Codes",
    description:
      "Quickly create static QR codes that direct users to any URL. Perfect for websites, resumes, menus, or event invites. Simple, fast, and effective.",
  },
  {
    imageUrl: "https://res.cloudinary.com/dlesei0kn/image/upload/v1753851334/20250601_012048_0000_whdyjw.png",
    title: "Download in Multiple Formats",
    description:
      "Save your QR codes as high-quality PNG, JPG, or PDF files—ideal for both digital and print use.",
  },
  {
    imageUrl: "https://res.cloudinary.com/dlesei0kn/image/upload/v1753800961/20250601_011723_0000_yq8ua6.png",
    title: "Access Your QR Codes Anytime",
    description:
      "All QR codes are securely stored in My QR Codes. Re-download, organize, or manage your codes anytime.",
  },
  {
    imageUrl: "https://res.cloudinary.com/dlesei0kn/image/upload/v1753805713/file_000000007abc622fbc96f3313ec500c2_mqdaq2.png",
    title: "Organize with Collections",
    description:
      "Group your QR codes into collections. Export entire sets as professional, branded PDFs in various layout styles.",
  },
];

const HowToUseSection: React.FC = () => {
  return (
    <section className="p-0 m-0 bg-transparent">
      <div className="w-full max-w-7xl mx-auto px-4">
        {/* Introduction */}
        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight" style={{ color: "inherit" }}>
            What We Offer
          </h2>
          <p className="text-sm sm:text-sm md:text-lg max-w-xl mx-auto" style={{ color: "inherit" }}>
            Discover how FlashQR empowers you to create, manage, and share your QR codes professionally.
          </p>
        </div>

        {/* Features Section - Added below "What We Offer" heading */}
        <FeaturesSection />

        {/* Feature Slides */}
        <div>
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between
                ${index % 2 !== 0 ? 'flex-row-reverse' : 'flex-row'}
                gap-4 sm:gap-6 md:gap-12
                mb-12
                flex-nowrap
              `}
            >
              <div className="w-[54%] px-2">
                <h3 className="text-sm sm:text-base md:text-2xl font-bold mb-2 sm:mb-4" style={{ color: "inherit" }}>
                  {slide.title}
                </h3>
                <p className="text-xs sm:text-sm md:text-base leading-relaxed" style={{ color: "inherit" }}>
                  {slide.description}
                </p>
              </div>
              <div className="w-[46%] px-2 flex justify-center">
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full max-w-full max-h-[160px] sm:max-h-[220px] md:max-h-[300px] object-contain"
                  style={{ background: "transparent", boxShadow: "none", border: "none" }}
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
       
    </section>
  );
};

export default HowToUseSection;
