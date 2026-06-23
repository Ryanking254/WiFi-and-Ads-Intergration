import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adServingAPI } from '../api';

export default function AdPlayer() {
  const [searchParams] = useSearchParams();
  const [ad, setAd] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const placementId = searchParams.get('placement_id') || 'wifi-portal';
  const returnUrl = searchParams.get('return_url') || '/';

  // Fetch ad on mount
  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await adServingAPI.serveAd(placementId);
        setAd(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load ad. Please try again.');
        setLoading(false);
      }
    };

    fetchAd();
  }, [placementId]);

  // Countdown timer
  useEffect(() => {
    if (!ad || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [ad, timeRemaining]);

  // Auto-redirect after countdown
  useEffect(() => {
    if (timeRemaining === 0 && ad) {
      // Redirect back to the return URL
      window.location.href = returnUrl;
    }
  }, [timeRemaining, ad, returnUrl]);

  const handleCTAClick = () => {
    // Open CTA URL in new tab, but keep the countdown going
    if (ad?.cta_url) {
      window.open(ad.cta_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Loading ad...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <p className="text-2xl mb-4">{error}</p>
          <a href={returnUrl} className="text-blue-400 underline">
            Click here to continue
          </a>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <p className="text-2xl mb-4">No ads available at the moment</p>
          <a href={returnUrl} className="text-blue-400 underline">
            Click here to continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Ad Content */}
      <div className="flex flex-col items-center justify-center max-w-2xl px-6">
        {/* Ad Image */}
        {ad.image_url && (
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full max-w-xl rounded-lg mb-8 shadow-2xl"
          />
        )}

        {/* Ad Title */}
        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          {ad.title}
        </h1>

        {/* Ad Description */}
        {ad.description && (
          <p className="text-xl text-gray-300 text-center mb-8 max-w-lg">
            {ad.description}
          </p>
        )}

        {/* CTA Button */}
        {ad.cta_text && (
          <button
            onClick={handleCTAClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg mb-12 transition-colors"
          >
            {ad.cta_text}
          </button>
        )}
      </div>

      {/* Timer and Info */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center">
        {/* Timer */}
        <div className="text-white text-center mb-4">
          <p className="text-sm text-gray-400 mb-2">You'll be redirected in</p>
          <p className="text-6xl font-bold text-blue-400">{timeRemaining}s</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-1000"
            style={{ width: `${(timeRemaining / 15) * 100}%` }}
          />
        </div>

        {/* Skip Info */}
        <p className="text-gray-400 text-sm mt-4">
          Please watch the entire ad to continue
        </p>
      </div>

      {/* Close Button (for debugging, hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <a
          href={returnUrl}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm underline"
        >
          Skip (dev only)
        </a>
      )}
    </div>
  );
}
