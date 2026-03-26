import React, { useState } from 'react';

type ImageWithFallbackProps = {
  src: string;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
  [key: string]: any;
};

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = '/W.png',
  alt = '',
  className,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
      {...props}
    />
  );
};
