import React from 'react';
import { cn } from '../../lib/utils';

interface OrganizerAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: number;
}

export const OrganizerAvatar: React.FC<OrganizerAvatarProps> = ({ src, alt = '', className, size = 22 }) => {
  return (
    <div className={cn(
      "bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/40",
      className
    )}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: size ? `${size}px` : undefined }}>groups</span>
      )}
    </div>
  );
};
