import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../contexts/BrandingContext';

// Configuration constants
const CONFIG = {
  BRAND_NAME: "Linkage VA Hub",
  HOST_TIMEZONE: "Asia/Manila",
  HOST_START_HOUR_LOCAL: 19, // 7PM Manila
  HOST_START_MINUTE_LOCAL: 0,
  SESSION_DURATION_MINUTES: 90,
  WEBINAR_DAY: 30, // 30th of each month
};

// Video loading states
const VIDEO_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};

// Custom hook for webinar countdown
const useWebinarCountdown = () => {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextWebinarDate, setNextWebinarDate] = useState(null);
  const [timeLabel, setTimeLabel] = useState('');
  const [mobileTimeShort, setMobileTimeShort] = useState('');

  const computeNextWebinar = useCallback(() => {
    const now = new Date();
    const utcHour = CONFIG.HOST_START_HOUR_LOCAL - 8; // Manila UTC+8

    let year = now.getUTCFullYear();
    let month = now.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const day = Math.min(CONFIG.WEBINAR_DAY, lastDay);

    const candidate = new Date(Date.UTC(year, month, day, utcHour, CONFIG.HOST_START_MINUTE_LOCAL, 0));
    const nowManilaMs = now.getTime() + 8 * 3600_000;
    const candidateManilaMs = candidate.getTime() + 8 * 3600_000;

    if (nowManilaMs >= candidateManilaMs) {
      // Move to next month
      if (month === 11) {
        year += 1;
        month = 0;
      } else {
        month += 1;
      }
      const nextMonthLastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const nextDay = Math.min(CONFIG.WEBINAR_DAY, nextMonthLastDay);
      return new Date(Date.UTC(year, month, nextDay, utcHour, CONFIG.HOST_START_MINUTE_LOCAL, 0));
    }

    return candidate;
  }, []);

  useEffect(() => {
    const startUtc = computeNextWebinar();
    setNextWebinarDate(startUtc);

    // Format date/time labels
    const formatLocal = (dt) => {
      try {
        return new Intl.DateTimeFormat(undefined, {
          dateStyle: 'full',
          timeStyle: 'short'
        }).format(dt);
      } catch (e) {
        return dt.toLocaleString();
      }
    };

    setTimeLabel(`Next live webinar: ${formatLocal(startUtc)} (hosted in ${CONFIG.HOST_TIMEZONE}).`);

    try {
      const shortFormat = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(startUtc);
      setMobileTimeShort(shortFormat);
    } catch (e) {
      setMobileTimeShort(startUtc.toLocaleString());
    }

    // Update countdown every second
    const updateCountdown = () => {
      const now = new Date();
      const diff = Math.max(0, startUtc.getTime() - now.getTime());

      if (diff <= 0) {
        setTimeLabel('Registration for this session has closed. Secure your seat for the next webinar.');
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [computeNextWebinar]);

  return {
    countdown,
    nextWebinarDate,
    timeLabel,
    mobileTimeShort
  };
};

// Enhanced VideoPlayer component with CORS and error handling
function VideoPlayer({ src, poster, fallbackPoster, onPlay, className = '' }) {
  const [videoState, setVideoState] = useState(VIDEO_STATES.IDLE);
  const [thumbnail, setThumbnail] = useState(null);
  const [posterError, setPosterError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Generate thumbnail from video frame
  const generateThumbnail = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setThumbnail(dataUrl);
    } catch (e) {
      console.warn('Failed to generate thumbnail:', e);
    }
  }, []);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    setVideoState(VIDEO_STATES.LOADING);

    // Try to generate thumbnail at 0.1 seconds
    if (videoRef.current) {
      videoRef.current.currentTime = 0.1;
    }
  }, []);

  // Handle video data loaded
  const handleLoadedData = useCallback(() => {
    setVideoState(VIDEO_STATES.READY);
    generateThumbnail();

    // Reset to beginning after thumbnail
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [generateThumbnail]);

  // Handle video errors with detailed logging
  const handleVideoError = useCallback((e) => {
    const video = videoRef.current;
    const error = video?.error;

    console.error('Video error:', {
      code: error?.code,
      message: error?.message,
      networkState: video?.networkState,
      readyState: video?.readyState,
      src: video?.src,
      currentSrc: video?.currentSrc
    });

    setVideoState(VIDEO_STATES.ERROR);
  }, []);

  // Handle poster image error
  const handlePosterError = useCallback(() => {
    setPosterError(true);
  }, []);

  // Trigger manual load on mount
  useEffect(() => {
    if (videoRef.current && videoState === VIDEO_STATES.IDLE) {
      setVideoState(VIDEO_STATES.LOADING);
      videoRef.current.load();
    }
  }, [videoState]);

  const currentPoster = posterError ? fallbackPoster : (thumbnail || poster);

  return (
    <div className="relative">
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading indicator */}
      {videoState === VIDEO_STATES.LOADING && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderBottomColor: '#2173b8' }}></div>
            <p className="mt-2 text-sm text-gray-600">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {videoState === VIDEO_STATES.ERROR ? (
        <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-gray-600">Video unavailable</p>
            <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className={`w-full h-auto aspect-video object-cover ${className}`}
          src={src}
          poster={currentPoster}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleLoadedData}
          onError={handleVideoError}
          onPlay={onPlay}
        >
          Your browser does not support the video tag.
        </video>
      )}
      {poster && !posterError && (
        <img
          src={poster}
          alt=""
          className="hidden"
          onError={handlePosterError}
          onLoad={() => setPosterError(false)}
        />
      )}
    </div>
  );
}

export default function Community() {
  const { loading: brandingLoading } = useBranding();
  const { countdown, nextWebinarDate, timeLabel, mobileTimeShort } = useWebinarCountdown();
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', country: '', experience: '', messenger: '', consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rotating banner messages
  const bannerMessages = useRef([
    "🚀 Fastest Path to Landing a $4–$5/Hour VA Job in the Philippines",
    "Join Hundreds of VAs Who've Already Joined and Unlocked Your Success Today!",
    "Linkage VA Hub: Your Go-To Source for Elite VA Training & Top-Dollar Gigs in the Philippines."
  ]).current;
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // FAQ accordion state
  const [openFAQIndex, setOpenFAQIndex] = useState(null);

  // Benefit cards expansion state
  const [expandedBenefit, setExpandedBenefit] = useState(null);
  
  // Update to handle multiple expanded benefits
  const [expandedBenefits, setExpandedBenefits] = useState({
    priority: false,
    earnings: false,
    investment: false
  });
  
  const toggleBenefit = (benefit) => {
    setExpandedBenefits(prev => ({
      ...prev,
      [benefit]: !prev[benefit]
    }));
  };

  // Interactive rate calculator state
  const [selectedRate, setSelectedRate] = useState(5); // Default to $5/hour
  const [showBonusExample, setShowBonusExample] = useState(false);

  // Calculate earnings in pesos
  const calculateEarnings = (hourlyRateUSD) => {
    const exchangeRate = 56; // PHP per USD
    const hoursPerWeek = 40;
    const weeksPerMonth = 4.3;

    const hourlyPHP = hourlyRateUSD * exchangeRate;
    const dailyPHP = hourlyPHP * 8;
    const weeklyPHP = hourlyPHP * hoursPerWeek;
    const monthlyPHP = hourlyPHP * hoursPerWeek * weeksPerMonth;

    return {
      hourly: Math.round(hourlyPHP),
      daily: Math.round(dailyPHP),
      weekly: Math.round(weeklyPHP),
      monthly: Math.round(monthlyPHP)
    };
  };

  const earnings = calculateEarnings(selectedRate);

  // Add glowing animation styles and Lottie script
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes glowPulse {
        0% {
          box-shadow: 0 0 5px #2173b8, 0 0 10px #2173b8, 0 0 15px #2173b8;
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 10px #2173b8, 0 0 20px #2173b8, 0 0 30px #2173b8, 0 0 40px #2173b8;
          transform: scale(1.02);
        }
        100% {
          box-shadow: 0 0 5px #2173b8, 0 0 10px #2173b8, 0 0 15px #2173b8;
          transform: scale(1);
        }
      }
      .priority-glow {
        animation: glowPulse 2s ease-in-out infinite;
        position: relative;
      }
      .priority-glow:hover {
        animation: none;
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);

    // Load Lottie animation script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.1/dist/dotlottie-wc.js';
    script.type = 'module';
    document.head.appendChild(script);

    // Add Lottie animation element after script loads
    script.onload = () => {
      const animationContainer = document.getElementById('global-reach-animation');
      if (animationContainer && !animationContainer.querySelector('dotlottie-wc')) {
        animationContainer.innerHTML = `
          <dotlottie-wc
            src="https://lottie.host/2f9f739f-eb10-423b-917c-acfc8995d4dc/Vyhsm3XW3Q.lottie"
            style="width: 100%; height: 100%;"
            autoplay
            loop>
          </dotlottie-wc>
        `;
      }
    };

    return () => {
      document.head.removeChild(style);
      // Clean up Lottie script if needed
      const lottieScript = document.querySelector('script[src*="dotlottie-wc"]');
      if (lottieScript) {
        document.head.removeChild(lottieScript);
      }
    };
  }, []);

  // Rotate banner messages every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % bannerMessages.length);
        setIsTransitioning(false);
      }, 300); // Half of transition duration for smooth fade
    }, 6000);

    return () => clearInterval(interval);
  }, [bannerMessages]);

  // Track events
  const track = (name, props) => {
    try {
      if (window.gtag) window.gtag('event', name, props || {});
      if (window.analytics?.track) window.analytics.track(name, props || {});
    } catch (e) {}
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.country || !formData.experience || !formData.consent) {
      alert('Please complete all required fields with valid information.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Duplicate check
    const key = `va_webinar_email_${formData.email}`;
    if (localStorage.getItem(key)) {
      setShowForm(false);
      return;
    }

    setIsSubmitting(true);
    track('webinar_register_attempt', { source: 'community_page' });

    try {
      const data = {
        ...formData,
        email: formData.email.toLowerCase().trim(),
        webinarStartISO: nextWebinarDate?.toISOString(),
        submittedAt: new Date().toISOString(),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        utm: {}
      };

      // Try to submit to backend
      try {
        await fetch('/api/webinar/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (err) {
        console.log('Backend not available, showing success anyway');
      }

      localStorage.setItem(key, '1');
      localStorage.setItem('va_webinar_last_submit', String(Date.now()));
      setShowForm(false);
      track('webinar_register_success', { source: 'community_page' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate calendar links
  const generateCalendarLinks = () => {
    if (!nextWebinarDate) return { google: '', ics: '' };

    const end = new Date(nextWebinarDate.getTime() + CONFIG.SESSION_DURATION_MINUTES * 60_000);
    const title = 'Virtual Assistant Jobs Webinar';
    const desc = 'Live webinar: Remote VA roles starting at $4–$5/hr with bonuses and respectful raises within your first year.';

    const formatForGoogle = (dt) => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');

    const googleParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${formatForGoogle(nextWebinarDate)}/${formatForGoogle(end)}`,
      details: desc
    });

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Linkage//VA Webinar//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@linkage.ph`,
      `DTSTAMP:${formatForGoogle(new Date())}`,
      `DTSTART:${formatForGoogle(nextWebinarDate)}`,
      `DTEND:${formatForGoogle(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join('\r\n');

    const icsBlob = new Blob([icsContent], { type: 'text/calendar' });
    const icsUrl = URL.createObjectURL(icsBlob);

    return {
      google: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
      ics: icsUrl
    };
  };

  const { google: googleCalUrl, ics: icsUrl } = generateCalendarLinks();

  // Loading state
  if (brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Virtual Assistant Jobs Webinar",
    description: "Live webinar teaching how to qualify for remote VA roles starting at $4–$5/hr, including bonuses and respectful raises within your first year.",
    startDate: nextWebinarDate?.toISOString(),
    endDate: nextWebinarDate ? new Date(nextWebinarDate.getTime() + CONFIG.SESSION_DURATION_MINUTES * 60_000).toISOString() : null,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "VirtualLocation",
      url: "https://linkage.ph/community"
    },
    organizer: {
      "@type": "Organization",
      name: CONFIG.BRAND_NAME,
      url: "https://linkage.ph"
    }
  };

  return (
    <>
      <Helmet>
        <title>Virtual Assistant Jobs Webinar ₱999 | Get Hired Remotely</title>
        <meta name="description" content="Join our PAID webinar (₱999) on the 30th of every month to learn how to qualify for remote VA roles starting at $4–$5/hr, including bonuses and respectful raises in your first year. Register now." />
        <meta property="og:title" content="Virtual Assistant Jobs Webinar ₱999 | Get Hired Remotely" />
        <meta property="og:description" content="Join our live webinar on the 30th of every month to learn how to qualify for remote VA roles starting at $4–$5 per hour with bonuses and respectful raises in your first year. Register now." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/community" />
        <meta property="og:image" content="/images/community-invite-poster.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Virtual Assistant Jobs Webinar invitation" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Virtual Assistant Jobs Webinar | Get Hired Remotely" />
        <meta name="twitter:description" content="Join our live webinar on the 30th of every month to learn how to qualify for remote VA roles starting at $4–$5 per hour with bonuses and respectful raises in your first year. Register now." />
        <meta name="twitter:image" content="/images/community-invite-poster.svg" />
        <link rel="canonical" href="/community" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <main className="min-h-screen bg-white text-gray-900">
        {/* Value Proposition Message - Rotating Banner */}
        <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="relative h-6 sm:h-7 overflow-hidden">
              <p
                className={`text-center text-sm sm:text-base font-semibold text-gray-900 absolute inset-0 flex items-center justify-center transition-opacity duration-600 ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ transitionDuration: '600ms' }}
              >
                {bannerMessages[currentMessageIndex]}
              </p>
            </div>
          </div>
        </div>

        {/* Paid Webinar Notice */}
        <div className="w-full py-2" style={{ backgroundColor: '#ea2727' }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-white font-bold animate-pulse">
              ⚡ PAID WEBINAR: ₱999 Investment Required ⚡
            </p>
          </div>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Get hired as a Virtual Assistant
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-700">
                Remote VA roles starting at <strong>$4–$5 per hour</strong>, with bonuses and respectful raises in your first year. Attend our <span className="px-1 font-bold" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>paid webinar (₱999)</span> to learn how to qualify and get hired fast.
              </p>

              {/* Video invite - positioned after the main value proposition */}
              <div className="mt-6 relative">
                <div className="absolute -top-2 right-2 z-10 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg" style={{ backgroundColor: '#4338ca' }}>
                  ₱999 WEBINAR FEE
                </div>
                <VideoPlayer
                  src="https://storage.googleapis.com/msgsndr/QcArhd5EeedJmTdRxDXY/media/68cd5682aeb2f019c79c0673.mp4"
                  poster="/images/community-invite-poster.svg"
                  fallbackPoster="/images/community-invite-poster.svg"
                  onPlay={() => track('video_invite_play', { source: 'community_page' })}
                  className="rounded-xl shadow-lg"
                />
                <p className="mt-3 text-sm text-gray-700 text-center">
                  Start earning sooner with professional training, fair pay, and opportunities to grow.
                </p>
              </div>

              {/* Countdown */}
              <div className="mt-6 rounded-xl border-2 border-gray-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 relative">
                <div className="absolute -top-3 left-4 text-white px-3 py-1 rounded text-sm font-bold" style={{ backgroundColor: '#3b82f6' }}>
                  ₱999 Investment
                </div>
                <p className="text-sm sm:text-base text-gray-800">
                  {timeLabel}
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center" aria-label="Countdown to next webinar" role="group">
                  {[
                    { label: 'Days', value: countdown.days },
                    { label: 'Hours', value: countdown.hours },
                    { label: 'Minutes', value: countdown.minutes },
                    { label: 'Seconds', value: countdown.seconds }
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-white p-3 shadow-sm border border-gray-200">
                      <div className="text-2xl font-bold tabular-nums">
                        {String(value).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-600">{label}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs font-medium" style={{ color: '#4338ca' }}>
                  Seats are limited and fill fast each month. Investment: ₱999
                </p>
              </div>

              {/* Primary CTA */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <a
                  href="#register"
                  className="inline-flex justify-center items-center rounded-md text-white px-6 py-3 text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 relative hover:opacity-90"
                  style={{ backgroundColor: '#2173b8', '--tw-ring-color': '#2173b8' }}
                  aria-label="Register for the ₱999 webinar"
                  onClick={() => track('webinar_register_cta_click', { source: 'community_page_hero' })}
                >
                  Register for ₱999 Webinar
                  <span className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full animate-bounce" style={{ backgroundColor: '#4338ca' }}>
                    PAID
                  </span>
                </a>
                <span className="text-sm text-gray-700">
                  Limited seats. Registration closes when the timer hits zero.
                </span>
              </div>

              <p className="mt-4 text-xs text-gray-600">
                ₱999 is for training only. No placement fees. We never charge VAs to get hired.
              </p>
            </div>

            {/* Registration Form - moved from below to hero grid */}
            <div id="register" className="rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm bg-white relative">
              {/* Pricing Banner */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-2 rounded-full shadow-lg">
                <span className="font-bold text-sm">WEBINAR FEE: ₱999</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mt-2">
                Reserve your seat for ₱999
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                We'll send payment instructions and reminders ahead of the session.
              </p>

              {/* Payment Notice */}
              <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: '#e0e7ff', borderColor: '#4338ca' }}>
                <p className="text-sm text-indigo-900 font-medium">
                  💳 Payment Required: ₱999 webinar fee
                </p>
                <p className="text-xs text-indigo-800 mt-1">
                  This covers professional training materials and live instruction. Job placement remains free.
                </p>
              </div>

              {showForm ? (
                <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4" noValidate>
                  {/* Honeypot */}
                  <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                  <div className="flex flex-col gap-1">
                    <label htmlFor="firstName" className="text-sm font-medium">First name</label>
                    <input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
                    <input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                      className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="country" className="text-sm font-medium">Country/Region</label>
                    <input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      required
                      className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="experience" className="text-sm font-medium">Years of VA or admin experience</label>
                    <select
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      required
                      className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>None</option>
                      <option>&lt;1 year</option>
                      <option>1–2 years</option>
                      <option>3+ years</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="messenger" className="text-sm font-medium">Philippine phone number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        +63
                      </span>
                      <input
                        id="messenger"
                        type="tel"
                        required
                        value={formData.messenger}
                        onChange={(e) => {
                          // Only allow numbers and basic formatting
                          const value = e.target.value.replace(/[^\d\s]/g, '');
                          setFormData({...formData, messenger: value});
                        }}
                        placeholder="9XX XXX XXXX"
                        className="flex-1 rounded-r border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-start gap-2">
                    <input
                      id="consent"
                      type="checkbox"
                      checked={formData.consent}
                      onChange={(e) => setFormData({...formData, consent: e.target.checked})}
                      required
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 focus:ring-2"
                      style={{ accentColor: '#2173b8' }}
                    />
                    <label htmlFor="consent" className="text-sm text-gray-800">
                      I agree to receive webinar information and job-related updates and accept the Privacy Policy.
                    </label>
                  </div>

                  <div className="mt-2 flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex justify-center items-center rounded-md text-white px-6 py-3 text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: '#2173b8' }}
                    >
                      {isSubmitting ? 'Registering...' : 'Proceed to Payment (₱999)'}
                    </button>
                    <span className="text-xs text-gray-700 text-center">We'll confirm your seat instantly.</span>
                  </div>

                  <p className="mt-2 text-xs text-gray-600 text-center">
                    ₱999 training fee required. No placement fees - we never charge VAs to get hired.
                  </p>
                </form>
              ) : (
                /* Success state */
                <div className="mt-6 rounded-lg border p-4" style={{ backgroundColor: '#e4effe', borderColor: '#2173b8' }}>
                  <p className="font-semibold" style={{ color: '#2173b8' }}>Registration received! Check your email for payment instructions (₱999) and joining details.</p>
                  <p className="mt-1 text-sm" style={{ color: '#2173b8' }}>
                    Next session: {nextWebinarDate ? nextWebinarDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }) : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <a
                      href={googleCalUrl}
                      className="inline-flex items-center rounded-md text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
                      style={{ backgroundColor: '#3b82f6' }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Add to Google Calendar
                    </a>
                    <a
                      href={icsUrl}
                      className="inline-flex items-center rounded-md bg-white text-gray-900 px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50"
                      download="va-webinar.ics"
                    >
                      Download ICS
                    </a>
                  </div>
                  <p className="mt-2 text-xs text-gray-700">Tip: Join 10 minutes early to test your audio and avoid delays.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Title */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
              Here's Exactly What Your ₱999 Gets You
            </h2>
            <p className="text-base text-gray-700 mb-8">
              Everything you need to launch your <span className="font-semibold" style={{ color: '#3b82f6' }}>$4-$5/hour VA career</span> in just 20 days
            </p>
          </div>

          {/* Benefits & Training Details Section - Full Width */}
          <div className="space-y-6">
            {/* Main Benefits Cards - Expandable */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Priority Access Card */}
              <div
                className={`rounded-xl border transform transition-all cursor-pointer ${
                  expandedBenefits.priority ? 'sm:col-span-3' : 'priority-glow'
                }`}
                style={{ backgroundColor: '#e4effe', borderColor: '#2173b8' }}
                onClick={() => toggleBenefit('priority')}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-white rounded-full p-2" style={{ backgroundColor: '#2173b8' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900 text-sm">Priority Access</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white animate-pulse" style={{ backgroundColor: '#4338ca' }}>
                          ⭐ VIP
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">First in line for Linkage's job opportunities</p>
                      {expandedBenefits.priority && (
                        <div className="mt-4 space-y-3 animate-fadeIn">
                          <div className="rounded-lg p-3" style={{ backgroundColor: '#f8f9fa' }}>
                            <h4 className="font-semibold text-sm mb-2" style={{ color: '#2173b8' }}>What Priority Access Means for You:</h4>
                            <ul className="space-y-2 text-xs text-gray-700">
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="#2173b8" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Your profile appears AHEAD of regular accounts when clients search for VAs
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="#2173b8" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                First notification when new high-paying clients post jobs
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="#2173b8" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Exclusive access to premium client accounts paying $5+/hour
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="#2173b8" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Priority support from our team when you need help
                              </li>
                            </ul>
                          </div>
                          <p className="text-xs italic font-medium" style={{ color: '#2173b8' }}>
                            "Our trained VAs get hired 3x faster than regular applicants!"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* $4+/Hour Card */}
              <div
                className={`rounded-xl border transform transition-all cursor-pointer ${
                  expandedBenefits.earnings ? 'sm:col-span-3' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: '#f3f4f6', borderColor: '#6b7280' }}
                onClick={() => toggleBenefit('earnings')}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-white rounded-full p-2" style={{ backgroundColor: '#1f2937' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm">$4+/Hour</h3>
                      <p className="text-xs text-gray-700 mt-1">Minimum rate with potential for higher pay</p>
                      {expandedBenefits.earnings && (
                        <div className="mt-4 space-y-3 animate-fadeIn">
                          <div className="rounded-lg p-3" style={{ backgroundColor: '#f8f9fa' }}>
                            <h4 className="font-semibold text-sm mb-2" style={{ color: '#1f2937' }}>Your Earning Potential:</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">1-3 Months Experience</span>
                                <span className="font-bold" style={{ color: '#3b82f6' }}>$4-$5/hour</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">6 Months - 1 Year Experience</span>
                                <span className="font-bold" style={{ color: '#3b82f6' }}>$6/hour</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">Over 1 Year Experience</span>
                                <span className="font-bold" style={{ color: '#3b82f6' }}>$6-$7/hour</span>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg p-2" style={{ backgroundColor: '#e0e7ff' }}>
                            <p className="text-xs" style={{ color: '#4338ca' }}>
                              <strong>Monthly Income Example:</strong> At $4/hour × 40 hours/week =
                              <span className="font-bold"> ₱35,000+ per month</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ₱999 Investment Card */}
              <div
                className={`rounded-xl border transform transition-all cursor-pointer ${
                  expandedBenefits.investment ? 'sm:col-span-3' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: '#e4effe', borderColor: '#2173b8' }}
                onClick={() => toggleBenefit('investment')}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-white rounded-full p-2" style={{ backgroundColor: '#2173b8' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm">₱999 Investment</h3>
                      <p className="text-xs text-gray-700 mt-1">3-week professional training program</p>
                      {expandedBenefits.investment && (
                        <div className="mt-4 space-y-3 animate-fadeIn">
                          <div className="rounded-lg p-3" style={{ backgroundColor: '#f8f9fa' }}>
                            <h4 className="font-semibold text-sm mb-2" style={{ color: '#2173b8' }}>Your ₱999 Investment Includes:</h4>
                            <ul className="space-y-2 text-xs text-gray-700">
                              <li className="flex items-start">
                                <span className="font-bold mr-2" style={{ color: '#2173b8' }}>✓</span>
                                40 hours of live training (20 days × 2 hours)
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2" style={{ color: '#2173b8' }}>✓</span>
                                Free GoHighLevel account (₱5,500/month value)
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2" style={{ color: '#2173b8' }}>✓</span>
                                AI tools training for content creation
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2" style={{ color: '#2173b8' }}>✓</span>
                                Lifetime access to our VA community
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2" style={{ color: '#2173b8' }}>✓</span>
                                Job placement assistance after graduation
                              </li>
                            </ul>
                          </div>
                          <div className="rounded-lg p-2 text-center" style={{ backgroundColor: '#e4effe' }}>
                            <p className="text-xs font-bold" style={{ color: '#2173b8' }}>
                              ROI: Earn back your investment in just 6-8 hours of VA work!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Earning Calculator & Bonus Benefits Section - ENHANCED */}
            <div className="rounded-xl p-6 border-2" style={{
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)',
              borderColor: '#3b82f6'
            }}>
              {/* 100% Bonus & Raise Benefits Banner */}
              <div className="mb-8 relative overflow-hidden rounded-2xl p-6 text-center" style={{
                background: 'linear-gradient(135deg, #2173b8 0%, #4338ca 50%, #3b82f6 100%)',
                boxShadow: '0 20px 40px rgba(38, 99, 235, 0.3)'
              }}>
                <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className="animate-bounce">
                      <span className="text-6xl">💰</span>
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
                    🚀 GAME CHANGER: You Keep 100% of Everything!
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-3xl mb-2">🎁</div>
                      <h3 className="font-bold text-white text-lg mb-1">100% of All Bonuses</h3>
                      <p className="text-white text-sm opacity-90">Every bonus your client pays goes directly to YOU</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-3xl mb-2">📈</div>
                      <h3 className="font-bold text-white text-lg mb-1">100% of All Raises</h3>
                      <p className="text-white text-sm opacity-90">When clients increase your rate, you keep every peso</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-sm animate-pulse">
                    ⚡ No agency fees • No commissions • All yours! ⚡
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                  Interactive Earning Calculator
                </h2>
                <p className="text-sm text-gray-700">
                  Move the slider to see your earning potential + bonuses in Philippine Pesos!
                </p>
              </div>

              {/* Interactive Rate Calculator */}
              <div className="bg-white rounded-2xl p-6 shadow-xl border-2 mb-6" style={{ borderColor: '#2173b8' }}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Your Hourly Rate Calculator
                  </h3>
                  <p className="text-sm text-gray-600">
                    Drag the slider to see your earning potential at different rates
                  </p>
                </div>

                {/* Rate Slider */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-700">$4/hour</span>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-1 transform transition-all duration-300 hover:scale-110" style={{
                        backgroundColor: '#2173b8',
                        boxShadow: `0 0 30px rgba(38, 99, 235, 0.3)`
                      }}>
                        <span className="text-2xl font-bold text-white">${selectedRate}</span>
                      </div>
                      <p className="text-xs text-gray-600">per hour</p>
                    </div>
                    <span className="text-sm font-medium text-gray-700">$15/hour</span>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      min="4"
                      max="15"
                      step="0.5"
                      value={selectedRate}
                      onChange={(e) => setSelectedRate(parseFloat(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #2173b8 0%, #2173b8 ${((selectedRate - 4) / 11) * 100}%, #e5e7eb ${((selectedRate - 4) / 11) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <style jsx>{`
                      .slider::-webkit-slider-thumb {
                        appearance: none;
                        height: 24px;
                        width: 24px;
                        border-radius: 50%;
                        background: #2173b8;
                        cursor: pointer;
                        box-shadow: 0 4px 8px rgba(38, 99, 235, 0.3);
                        transition: all 0.15s ease-in-out;
                      }
                      .slider::-webkit-slider-thumb:hover {
                        transform: scale(1.2);
                        box-shadow: 0 6px 12px rgba(38, 99, 235, 0.4);
                      }
                      .slider::-moz-range-thumb {
                        height: 24px;
                        width: 24px;
                        border-radius: 50%;
                        background: #2173b8;
                        cursor: pointer;
                        border: none;
                        box-shadow: 0 4px 8px rgba(38, 99, 235, 0.3);
                      }
                    `}</style>
                  </div>
                </div>

                {/* Dynamic Earnings Display */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="text-lg font-bold" style={{ color: '#2173b8' }}>₱{earnings.hourly.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">per hour</div>
                  </div>
                  <div className="text-center p-4 rounded-xl transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="text-lg font-bold" style={{ color: '#2173b8' }}>₱{earnings.daily.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">per day</div>
                  </div>
                  <div className="text-center p-4 rounded-xl transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="text-lg font-bold" style={{ color: '#2173b8' }}>₱{earnings.weekly.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">per week</div>
                  </div>
                  <div className="text-center p-4 rounded-xl transition-all duration-300 hover:scale-105 animate-pulse" style={{
                    backgroundColor: '#e4effe',
                    border: '2px solid #2173b8'
                  }}>
                    <div className="text-xl font-extrabold" style={{ color: '#2173b8' }}>₱{earnings.monthly.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-gray-900">per month</div>
                  </div>
                </div>

                {/* 100% Bonus & Raise Highlight */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-xl p-4 text-white text-center transform transition-all hover:scale-105">
                    <div className="text-2xl mb-2">🎁</div>
                    <h4 className="font-bold text-lg mb-1">+ 100% of Bonuses</h4>
                    <p className="text-sm text-white opacity-90">Clients often give ₱2,000-₱10,000+ bonuses</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl p-4 text-white text-center transform transition-all hover:scale-105">
                    <div className="text-2xl mb-2">📈</div>
                    <h4 className="font-bold text-lg mb-1">+ 100% of Raises</h4>
                    <p className="text-sm text-white opacity-90">Rate increases to ${selectedRate + 2}-${selectedRate + 5}/hour common</p>
                  </div>
                </div>
              </div>

              {/* Salary Comparison Bar Chart */}
              <div className="bg-white rounded-xl p-5 shadow-lg mb-6">
                <h3 className="font-bold text-gray-900 mb-4 text-center text-xl">
                  How Your VA Income Compares to Other Jobs In The Philippines
                </h3>

                <div className="space-y-4">
                  {/* Minimum Wage */}
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Minimum Wage (NCR)</span>
                      <span className="text-sm font-bold text-gray-900">₱610/day</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div className="h-full rounded-full flex items-center justify-end pr-2"
                           style={{
                             width: '30%',
                             backgroundColor: '#94a3b8'
                           }}>
                        <span className="text-xs text-white font-semibold">₱13,420/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Call Center Agent */}
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Call Center Agent</span>
                      <span className="text-sm font-bold text-gray-900">₱18,000-25,000/mo</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div className="h-full rounded-full flex items-center justify-end pr-2"
                           style={{
                             width: '50%',
                             backgroundColor: '#64748b'
                           }}>
                        <span className="text-xs text-white font-semibold">₱22,000 avg</span>
                      </div>
                    </div>
                  </div>

                  {/* Office Admin */}
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Office Admin</span>
                      <span className="text-sm font-bold text-gray-900">₱15,000-20,000/mo</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div className="h-full rounded-full flex items-center justify-end pr-2"
                           style={{
                             width: '40%',
                             backgroundColor: '#475569'
                           }}>
                        <span className="text-xs text-white font-semibold">₱17,500 avg</span>
                      </div>
                    </div>
                  </div>

                  {/* VA at Current Selected Rate */}
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold" style={{ color: '#2173b8' }}>VA at ${selectedRate}/hour (YOU!)</span>
                      <span className="text-sm font-bold" style={{ color: '#2173b8' }}>₱{earnings.monthly.toLocaleString()}/mo</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div className="h-full rounded-full flex items-center justify-end pr-2"
                           style={{
                             width: `${Math.min(100, (earnings.monthly / 44800) * 100)}%`,
                             background: 'linear-gradient(90deg, #2173b8 0%, #3b82f6 100%)'
                           }}>
                        <span className="text-xs text-white font-extrabold">
                          {((earnings.monthly - 13420) / 13420 * 100).toFixed(1)}% above minimum wage!
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center p-6 rounded-lg" style={{ backgroundColor: '#e0e7ff' }}>
                  <p className="text-lg font-bold" style={{ color: '#4338ca' }}>
                    🎯 That's ₱{earnings.monthly.toLocaleString()} per month working from home!
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    No commute, no office politics, flexible schedule
                  </p>
                </div>
              </div>

              {/* Real Bonus & Raise Scenarios */}
              <div className="bg-white rounded-xl p-6 shadow-lg mb-6 border-2" style={{ borderColor: '#10b981' }}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    🎁 Real Bonus & Raise Examples from Our VAs
                  </h3>
                  <p className="text-sm text-gray-600">
                    These are actual bonus and raise amounts our VAs have received - and you keep 100% of it!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Bonus Examples */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg text-center" style={{ color: '#10b981' }}>
                      💰 Bonus Examples (100% Yours!)
                    </h4>
                    {[
                      { occasion: "Holiday Bonus", amount: "₱5,600", description: "Christmas gift from grateful client" },
                      { occasion: "Project Completion", amount: "₱8,400", description: "After successful campaign launch" },
                      { occasion: "Birthday Bonus", amount: "₱2,800", description: "Personal touch from caring client" },
                      { occasion: "Performance Bonus", amount: "₱11,200", description: "Exceeded monthly targets" },
                      { occasion: "Anniversary Bonus", amount: "₱14,000", description: "One year of excellent service" }
                    ].map((bonus, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-105" style={{ backgroundColor: '#f0fdf4', borderColor: '#10b981' }}>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{bonus.occasion}</p>
                          <p className="text-xs text-gray-600">{bonus.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: '#10b981' }}>{bonus.amount}</p>
                          <p className="text-sm text-gray-500">100% yours</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Raise Examples */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg text-center" style={{ color: '#3b82f6' }}>
                      📈 Raise Examples (100% Yours!)
                    </h4>
                    {[
                      { timeline: "Month 6", from: "$5", to: "$6", reason: "Proved reliability" },
                      { timeline: "Year 1", from: "$6", to: "$7", reason: "Learned new skills" },
                      { timeline: "Year 2", from: "$7", to: "$8", reason: "Took on more tasks" },
                      { timeline: "Year 3", from: "$8", to: "$10", reason: "Became indispensable" },
                      { timeline: "Year 4+", from: "$10", to: "$12", reason: "Expert level achieved" }
                    ].map((raise, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-105" style={{ backgroundColor: '#eff6ff', borderColor: '#3b82f6' }}>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{raise.timeline}</p>
                          <p className="text-xs text-gray-600">{raise.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm" style={{ color: '#3b82f6' }}>
                            {raise.from} → {raise.to}/hr
                          </p>
                          <p className="text-xs" style={{ color: '#10b981' }}>
                            +₱{Math.round((parseFloat(raise.to.slice(1)) - parseFloat(raise.from.slice(1))) * 56 * 40 * 4.3).toLocaleString()}/mo
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combined Impact Example */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-center">
                  <h4 className="font-bold text-xl text-white mb-3">
                    🚀 Real Example: Sara's First Year Journey
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <p className="font-semibold text-lg">Started at $5/hour</p>
                      <p className="text-sm">₱{Math.round(5 * 56 * 40 * 4.3).toLocaleString()}/month</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <p className="font-semibold text-lg">Got raises to $9/hour</p>
                      <p className="text-sm">₱{Math.round(9 * 56 * 40 * 4.3).toLocaleString()}/month</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <p className="font-semibold text-lg">Plus ₱25,000 in bonuses</p>
                      <p className="text-sm">Throughout the year</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white bg-opacity-30 rounded-lg p-4">
                    <p className="font-bold text-2xl text-white">
                      Total First Year Earnings: ₱{Math.round(9 * 56 * 40 * 4.3 * 12 + 25000).toLocaleString()}
                    </p>
                    <p className="text-sm text-white opacity-90">
                      That's ₱{Math.round((9 * 56 * 40 * 4.3 * 12 + 25000) / 12).toLocaleString()} per month average!
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-center p-4 rounded-lg" style={{ backgroundColor: '#ecfdf5', border: '2px solid #10b981' }}>
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    💡 The Secret: Other agencies keep 20-50% of your bonuses and raises
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    With Linkage VA Hub, every peso of bonus and every rate increase goes directly to YOU
                  </p>
                  <div className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                    🎯 That's thousands more in your pocket every year!
                  </div>
                </div>
              </div>

              {/* What This Income Can Buy */}
              <div className="bg-white rounded-xl p-5 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
                  What ₱{earnings.monthly.toLocaleString()}/Month Can Do For You
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#e4effe' }}>
                    <div className="text-2xl mb-1">🏠</div>
                    <p className="text-sm font-semibold text-gray-900">Rent a Nice Condo</p>
                    <p className="text-sm text-gray-600">₱15,000-20,000/mo</p>
                    <p className="text-sm font-bold" style={{ color: '#2173b8' }}>✓ Covered!</p>
                  </div>

                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                    <div className="text-2xl mb-1">🛒</div>
                    <p className="text-sm font-semibold text-gray-900">Groceries</p>
                    <p className="text-sm text-gray-600">₱8,000-10,000/mo</p>
                    <p className="text-sm font-bold" style={{ color: '#1f2937' }}>✓ Easy!</p>
                  </div>

                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#e4effe' }}>
                    <div className="text-2xl mb-1">📱</div>
                    <p className="text-sm font-semibold text-gray-900">Internet & Phone</p>
                    <p className="text-sm text-gray-600">₱2,000-3,000/mo</p>
                    <p className="text-sm font-bold" style={{ color: '#2173b8' }}>✓ No problem!</p>
                  </div>

                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                    <div className="text-2xl mb-1">💰</div>
                    <p className="text-sm font-semibold text-gray-900">Savings</p>
                    <p className="text-sm text-gray-600">₱5,000-10,000/mo</p>
                    <p className="text-sm font-bold" style={{ color: '#1f2937' }}>✓ Build wealth!</p>
                  </div>

                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#e4effe' }}>
                    <div className="text-2xl mb-1">👨‍👩‍👧‍👦</div>
                    <p className="text-sm font-semibold text-gray-900">Family Support</p>
                    <p className="text-sm text-gray-600">Help parents/siblings</p>
                    <p className="text-sm font-bold" style={{ color: '#2173b8' }}>✓ Be the hero!</p>
                  </div>

                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                    <div className="text-2xl mb-1">🎯</div>
                    <p className="text-sm font-semibold text-gray-900">Future Goals</p>
                    <p className="text-sm text-gray-600">House, car, business</p>
                    <p className="text-sm font-bold" style={{ color: '#1f2937' }}>✓ Achievable!</p>
                  </div>
                </div>

                <div className="mt-4 border-2 rounded-lg p-4 text-center" style={{
                  backgroundColor: '#e0e7ff',
                  borderColor: '#3b82f6'
                }}>
                  <p className="text-lg font-extrabold text-gray-900 mb-2">
                    Your ₱999 Investment Returns in Just {Math.ceil(999 / earnings.hourly)} Hours of Work!
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    After that, every peso you earn is pure profit
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold" style={{ color: '#4338ca' }}>₱999</p>
                      <p className="text-xs text-gray-600">Your Investment</p>
                    </div>
                    <svg className="w-8 h-8" fill="#3b82f6" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <div className="text-center">
                      <p className="text-2xl font-bold" style={{ color: '#2173b8' }}>₱{earnings.monthly.toLocaleString()}+</p>
                      <p className="text-xs text-gray-600">Monthly Income</p>
                    </div>
                  </div>

                  <div className="mt-3 animate-bounce">
                    <span className="inline-block px-4 py-2 rounded-full text-white font-bold text-sm" style={{ backgroundColor: '#3b82f6' }}>
                      That's a {Math.round((earnings.monthly / 999) * 100).toLocaleString()}% Return Every Month!
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-700 mb-2">
                  While your friends spend ₱999 on a night out or new clothes...
                </p>
                <p className="text-lg font-bold text-gray-900">
                  You're investing in a career that pays <span style={{ color: '#3b82f6' }}>₱{earnings.monthly.toLocaleString()}+ every month!</span>
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  This isn't just a webinar. It's your ticket to financial freedom.
                </p>
              </div>
            </div>

            {/* Global Reach Section */}
            <div className="rounded-xl p-6 border-2" style={{
              background: 'linear-gradient(135deg, #1a365d 0%, #2173b8 50%, #1a365d 100%)',
              borderColor: '#2173b8'
            }}>
              <div className="text-center mb-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                  Your Profile Reaches a Global Audience
                </h2>
                <p className="text-lg text-blue-100 max-w-3xl mx-auto">
                  We connect Filipino VAs with businesses across the United States and worldwide.
                  Join our network of <span className="text-yellow-300 font-bold">10,000+ businesses</span> actively
                  looking to hire talented VAs every single month.
                </p>
              </div>

              {/* Lottie Animation Container */}
              <div className="flex justify-center items-center my-8">
                <div id="global-reach-animation" style={{ width: '100%', maxWidth: '500px', height: '400px' }}>
                  {/* Lottie animation will be inserted here */}
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-300">10,000+</div>
                  <div className="text-sm text-white/90">Active Businesses</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-300">50+</div>
                  <div className="text-sm text-white/90">Countries</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-300">USA</div>
                  <div className="text-sm text-white/90">Primary Market</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-300">24/7</div>
                  <div className="text-sm text-white/90">Global Hiring</div>
                </div>
              </div>

              {/* Countries List */}
              <div className="mt-6 text-center">
                <p className="text-sm text-blue-100 mb-3">Businesses from these locations are actively hiring:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['🇺🇸 USA', '🇨🇦 Canada', '🇬🇧 UK', '🇦🇺 Australia', '🇳🇿 New Zealand', '🇸🇬 Singapore', '🇩🇪 Germany', '🇫🇷 France', '🇳🇱 Netherlands', '🇦🇪 UAE'].map((country) => (
                    <span key={country} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white border border-white/30">
                      {country}
                    </span>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-8 text-center">
                <p className="text-white/90 mb-4 text-lg">
                  Join thousands of successful VAs connecting with international clients daily
                </p>
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold rounded-full shadow-lg animate-pulse">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Your Global Career Starts in 20 Days
                </div>
              </div>
            </div>

            {/* Audio Testimonial Section */}
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#e4effe', borderColor: '#2173b8' }}>
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="#2173b8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <h3 className="font-bold text-gray-900">Hear From Our Founder</h3>
                <span className="ml-auto text-white text-xs px-2 py-1 rounded-full font-semibold animate-pulse" style={{ backgroundColor: '#4338ca' }}>
                  MUST LISTEN
                </span>
              </div>

              <div className="rounded-lg p-4 shadow-inner" style={{ backgroundColor: '#f8f9fa' }}>
                <audio
                  id="founder-message"
                  className="w-full"
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                >
                  <source
                    src="https://storage.googleapis.com/msgsndr/QcArhd5EeedJmTdRxDXY/media/68cd3e99253906c81a140a98.mpeg"
                    type="audio/mpeg"
                  />
                  Your browser does not support the audio element.
                </audio>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        const audio = document.getElementById('founder-message');
                        audio.playbackRate = 1.0;
                      }}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      1x
                    </button>
                    <button
                      onClick={() => {
                        const audio = document.getElementById('founder-message');
                        audio.playbackRate = 1.5;
                      }}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      1.5x
                    </button>
                    <button
                      onClick={() => {
                        const audio = document.getElementById('founder-message');
                        audio.playbackRate = 2.0;
                      }}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      2x
                    </button>
                  </div>
                  <span className="text-gray-500">
                    Pat Murphy's personal message about this opportunity
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: '#e0e7ff' }}>
                <p className="text-xs text-center font-medium" style={{ color: '#4338ca' }}>
                  🎧 Listen to why this training can change your life as a VA in the Philippines
                </p>
              </div>
            </div>

            {/* Training Schedule Timeline */}
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#2173b8' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="#2173b8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Live Training Schedule
                </h3>
                <span className="text-white text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: '#2173b8' }}>20 DAYS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2" style={{ borderColor: '#2173b8' }}>
                      <svg className="w-5 h-5" fill="none" stroke="#2173b8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">10 PM - 12 AM Daily</p>
                    <p className="text-xs text-gray-600">Live Zoom sessions</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2" style={{ borderColor: '#2173b8' }}>
                      <svg className="w-5 h-5" fill="none" stroke="#2173b8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Expert Training Team</p>
                    <p className="text-xs text-gray-600">Led by Pat Murphy & Team</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg p-3 backdrop-blur-sm" style={{ backgroundColor: '#f8f9fa' }}>
                <p className="text-center text-sm italic text-gray-800 font-medium">
                  "Learn skills that will pay you more than you've ever dreamt of"
                </p>
              </div>

              {/* Meet Your Training Team */}
              <div className="mt-4 rounded-lg p-4 border" style={{ backgroundColor: '#e4effe', borderColor: '#2173b8' }}>
                <h4 className="font-semibold text-gray-900 mb-3 text-center">Meet Your Training Team</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-sm font-bold" style={{ color: '#2173b8' }}>Pat Murphy</p>
                    <p className="text-xs text-gray-600">Lead Trainer & Owner</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-sm font-bold" style={{ color: '#2173b8' }}>Kristina Mauri</p>
                    <p className="text-xs text-gray-600">VA Trainer</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-sm font-bold" style={{ color: '#2173b8' }}>Shey Tiglao</p>
                    <p className="text-xs text-gray-600">VA Onboarding</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-sm font-bold" style={{ color: '#2173b8' }}>Rhoda Guevarra</p>
                    <p className="text-xs text-gray-600">Human Resources</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center col-span-2">
                    <p className="text-sm font-bold" style={{ color: '#2173b8' }}>Brian Murphy</p>
                    <p className="text-xs text-gray-600">Chief of Operations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Included Feature List */}
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#2173b8' }}>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  What's Included in Your Training
                </span>
                <span className="text-sm text-white px-2 py-1 rounded-full font-bold" style={{ backgroundColor: '#4338ca' }}>
                  Total Value: ₱15,000+
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "🎯", title: "Free GoHighLevel Account", desc: "Primary training focus", value: "₱5,500/month value" },
                  { icon: "🤖", title: "AI Tools Training", desc: "ChatGPT, Claude, & more", value: "₱3,000 value" },
                  { icon: "🎬", title: "Video Creation Training", desc: "Professional video skills", value: "₱2,500 value" },
                  { icon: "💼", title: "Lead Generation Mastery", desc: "Client acquisition techniques", value: "₱2,000 value" },
                  { icon: "📊", title: "CRM Management Skills", desc: "Customer relationship tools", value: "₱1,500 value" },
                  { icon: "📚", title: "LinkedIn Optimization", desc: "Profile & networking strategies", value: "₱1,000 value" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3 relative overflow-hidden">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                      <p className="text-sm font-bold mt-1" style={{ color: '#2173b8' }}>{item.value}</p>
                    </div>
                    {index === 0 && (
                      <div className="absolute top-0 right-0 text-white text-xs px-2 py-0.5 rounded-bl-lg font-bold" style={{ backgroundColor: '#4338ca' }}>
                        HOT
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 border rounded-lg p-6" style={{ backgroundColor: '#e0e7ff', borderColor: '#3b82f6' }}>
                <p className="text-2xl text-center font-bold" style={{ color: '#4338ca' }}>
                  💰 All This for Only ₱999 - Save Over ₱14,000!
                </p>
                <p className="text-sm text-center text-gray-600 mt-2">
                  Complete training package designed to make you job-ready in 3 weeks
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="rounded-2xl p-6 sm:p-8 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#2173b8' }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {[
                {
                  question: "What is the ₱999 webinar about?",
                  answer: "This webinar introduces you to the essentials of becoming a successful virtual assistant (VA), including mastering skills like calendar management, travel booking, client automation, and brand building. It's designed for beginners and includes real-world tips to start earning quickly."
                },
                {
                  question: "Who is this webinar for?",
                  answer: "It's ideal for aspiring VAs, freelancers, or anyone interested in remote work opportunities. No prior experience is needed—just a passion for organization, client service, and flexible earning."
                },
                {
                  question: "How long is the webinar, and what is the schedule?",
                  answer: "The webinar runs daily from 10 PM to 12 AM (2 hours per session) for 20 days, totaling 40 hours of intensive training. Sessions are hosted live via Zoom, with recordings available for replay if you miss any."
                },
                {
                  question: "Who is on the training team, and what are their roles?",
                  answer: "The sessions are led by our expert team: Pat Murphy (Lead Trainer in Onboarding) guides the core training; Kristine Mae (Branding Coach) focuses on building your professional presence; and Brian Murphy (Chief of Operations and Human Resources) oversees operations and provides insights on career growth and client management."
                },
                {
                  question: "What will I learn in the webinar?",
                  answer: "You'll learn high-earning VA skills that can pay more than you've ever dreamed, including calendar management, appointment scheduling, travel booking, client journey automation, brand shaping, and advanced AI tools for content creation, video production, lead generation, and more. The training emphasizes practical, hands-on application."
                },
                {
                  question: "What format is the training, and do I need special equipment?",
                  answer: "It's interactive live sessions via Zoom, with real-time Q&A, projects, and feedback. You'll need a stable internet connection, computer or mobile device, and a webcam/mic (optional for participation). No advanced software required—we'll guide you through everything."
                },
                {
                  question: "What if I can't attend all live sessions? Will there be recordings?",
                  answer: "Yes! All sessions are recorded, and registrants get access within 24 hours, plus any materials, so you can catch up or review at your own pace."
                },
                {
                  question: "How does this webinar help me start earning as a VA?",
                  answer: "It provides actionable steps to build your skills, create a professional profile, and land clients—focusing on high-value abilities that can lead to soaring hourly rates. Many participants report starting freelance gigs within weeks, with ongoing community support."
                },
                {
                  question: "Am I able to start at a higher rate?",
                  answer: "Absolutely you can, depending on the type of VA you are—different jobs and specialties pay different rates, and your experience also matters. Our training helps you identify and leverage high-paying niches to maximize your earning potential from the start."
                },
                {
                  question: "What is the minimum earning rate I can expect?",
                  answer: "The $4 per hour rate is guaranteed 100%—that is our bare minimum when we advertise opportunities to our worldwide network of clients. This ensures you have a solid starting point, with potential to earn much more as you gain skills and experience."
                },
                {
                  question: "What is included in the ₱999 fee?",
                  answer: "The one-time fee covers all 20 sessions, a free GoHighLevel account (prioritized in training), access to AI tools for content/video creation and lead generation, downloadable resources, and entry to our VA community network. No hidden costs!"
                },
                {
                  question: "What is the refund policy?",
                  answer: "There are absolutely no refunds for this webinar, as we stand behind its value—we feel that even your first day of training is well worth the 999 pesos you pay for this comprehensive 20-day program. We're confident you'll see immediate benefits from the skills and resources provided."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                        openFAQIndex === index ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFAQIndex === index && (
                    <div className="px-6 pb-4 text-gray-700">
                      <p className="text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 border rounded-lg p-4 text-center" style={{ backgroundColor: '#e0e7ff', borderColor: '#3b82f6' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#2173b8' }}>
                Still have questions?
              </p>
              <p className="text-sm text-gray-700">
                Contact us at <a href="mailto:support@linkagevahub.com" className="hover:underline" style={{ color: '#2173b8' }}>support@linkagevahub.com</a> or join our community to connect with other VAs.
              </p>
            </div>
          </div>
        </section>

{/* Final CTA Section */}
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center">
            <a
              href="#register"
              className="inline-flex justify-center items-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-bold shadow-lg transform transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Register for the webinar"
              onClick={() => track('webinar_register_cta_click', { source: 'community_page_final_cta' })}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012 2h2a2 2 0 012-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Reserve Your Seat Now
            </a>
            <p className="mt-4 text-sm text-gray-600">
              Limited spots available • ₱999 investment in your future
            </p>
          </div>
        </section>

        {/* Mobile sticky CTA */}
        <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden" role="region" aria-label="Mobile register bar">
          <div className="mx-3 mb-3 rounded-lg border-2 border-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="text-sm">
                <span className="block font-semibold text-gray-900">Live VA Jobs Webinar</span>
                <span className="block text-gray-600">{mobileTimeShort}</span>
                <span className="block font-bold" style={{ color: '#4338ca' }}>₱999 Fee</span>
              </div>
              <a href="#register" className="inline-flex justify-center items-center rounded-md text-white px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90" style={{ backgroundColor: '#2173b8' }}>
                <span>₱999</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}