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

  const isPlaceholder = client.includes('YOUR_') || client.includes('ca-pub-0000000000000000');

  useEffect(() => {
    if (isPremium || isPlaceholder) return;
    
    if (adLoaded.current) return;

    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
      adLoaded.current = true;
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [isPremium, isPlaceholder]);

  if (isPremium) return null;

  if (isPlaceholder) {
    return (
      <div className={`w-full self-stretch ${className || ''}`}>
        <img src="/publicidad.jpg" alt="Publicidad" className="w-full h-full object-cover rounded-xl" />
      </div>
    );
  }

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
