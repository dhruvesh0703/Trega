import React from 'react';

interface TregaLogoProps {
  variant?: 'full' | 'horizontal' | 'mark' | 'mark-only';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  showSubtitle?: boolean;
  color?: string; // Kept for prop compatibility, but we use the image now
}

export const TregaLogo: React.FC<TregaLogoProps> = ({
  variant = 'horizontal',
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  // Map sizes to height classes for the image
  const sizeMap = {
    xs: 'h-4',
    sm: 'h-5',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-10',
    '2xl': 'h-14',
    hero: 'h-20',
  };

  const imgHeightClass = sizeMap[size] || sizeMap.md;

  const renderLogoImage = () => (
    <img 
      src="/trega123.png" 
      alt="Trega Logo" 
      className={`object-contain ${imgHeightClass}`} 
    />
  );

  if (variant === 'mark' || variant === 'mark-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderLogoImage()}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center ${className}`}>
        {renderLogoImage()}
        {showSubtitle && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mt-2">
            Hyperlocal Marketplace
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex flex-col justify-center text-left">
        <div className="flex items-center gap-1.5 leading-none">
          {renderLogoImage()}
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-stone-500 font-semibold tracking-tight mt-1">
            Local Marketplace
          </span>
        )}
      </div>
    </div>
  );
};
