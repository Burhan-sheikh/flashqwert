// server/routes/captcha.js
const express = require('express');
const https = require('https');
const router = express.Router();

// Rate limiting storage (in production, use Redis or database)
const attemptStore = new Map();

// Clean up old attempts (older than 24 hours)
const cleanupOldAttempts = () => {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  for (const [key, data] of attemptStore.entries()) {
    if (now - data.lastAttempt > dayInMs) {
      attemptStore.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupOldAttempts, 60 * 60 * 1000);

router.post('/verify-captcha', (req, res) => {
  const { captchaToken, deviceFingerprint, qrCodeId } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not set in environment variables.');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  if (!captchaToken) {
    return res.status(400).json({ success: false, error: 'Missing CAPTCHA token' });
  }

  // Check rate limiting
  const attemptKey = `${qrCodeId}_${deviceFingerprint}`;
  const attemptData = attemptStore.get(attemptKey) || { count: 0, lastAttempt: 0 };
  
  // If too many attempts, require additional verification
  if (attemptData.count >= 10) {
    const timeSinceLastAttempt = Date.now() - attemptData.lastAttempt;
    const cooldownPeriod = Math.min(60 * 60 * 1000, Math.pow(2, attemptData.count - 10) * 15 * 60 * 1000); // Max 1 hour
    
    if (timeSinceLastAttempt < cooldownPeriod) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many attempts. Please try again later.',
        cooldownRemaining: Math.ceil((cooldownPeriod - timeSinceLastAttempt) / 1000)
      });
    }
  }

  const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

  https.get(verificationURL, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    apiRes.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.success) {
          // Reset attempts on successful captcha
          attemptStore.delete(attemptKey);
          res.json({ success: true });
        } else {
          // Increment failed attempts
          attemptData.count += 1;
          attemptData.lastAttempt = Date.now();
          attemptStore.set(attemptKey, attemptData);
          
          console.log('reCAPTCHA verification failed', parsedData['error-codes']);
          res.json({ success: false, error: 'reCAPTCHA verification failed' });
        }
      } catch (parseError) {
        console.error('Error parsing reCAPTCHA response:', parseError);
        res.status(500).json({ success: false, error: 'Error parsing reCAPTCHA response' });
      }
    });
  }).on('error', (err) => {
    console.error('reCAPTCHA verification error:', err);
    res.status(500).json({ success: false, error: 'reCAPTCHA verification failed' });
  });
});

module.exports = router;
