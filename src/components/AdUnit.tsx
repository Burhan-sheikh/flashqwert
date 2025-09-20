import React, { useEffect } from 'react';

const AdUnit: React.FC = () => {
  useEffect(() => {
    // Make sure AdSense code gets executed to render ads
    if (window.adsbygoogle && window.adsbygoogle.length > 0) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('Error displaying ad', e);
      }
    }
  }, []);

  return (
    <div className="ad-container">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8218470498353675"
        data-ad-slot="4760970102"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdUnit;