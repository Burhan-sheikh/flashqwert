import React, { useEffect, useState } from 'react';

interface ScrollToTopButtonProps {
  isMenuOpen: boolean;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ isMenuOpen }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return isVisible && !isMenuOpen ? (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 left-6 z-50 p-2 hover:scale-110 transition-transform"
      aria-label="Scroll to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#3B8EFD" viewBox="0 0 24 24">
        <path d="M12 4l-8 8h6v8h4v-8h6z" />
      </svg>
    </button>
  ) : null;
};

export default ScrollToTopButton;
