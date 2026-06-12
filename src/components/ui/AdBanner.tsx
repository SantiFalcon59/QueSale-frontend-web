import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AdBannerProps {
  client: string;
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

/**
 * Reusable AdSense Banner Component
 */
export const AdBanner: React.FC<AdBannerProps> = ({ 
  client, 
  slot, 
  format = 'auto', 
  responsive = 'true',
  style,
  className
}) => {
  const { profile }: any = useAuth();
  const isPremium = profile?.role === 'admin' || profile?.is_premium;
  const adLoaded = React.useRef(false);

  useEffect(() => {
    if (isPremium) return;
    
    // Only push if not already loaded in this instance
    if (adLoaded.current) return;

    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
      adLoaded.current = true;
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={style || { display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

export default AdBanner;
