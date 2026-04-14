
// Importa React y los hooks necesarios
import React, { useEffect, useRef, useState } from 'react';


/**
 * Propiedades para el componente ImageWithFallback.
 * @property {string} src - Ruta de la imagen principal.
 * @property {string} [fallbackSrc] - Ruta de la imagen alternativa si falla la principal.
 * @property {string} [alt] - Texto alternativo para la imagen.
 * @property {string} [className] - Clases CSS opcionales.
 * @property {any} [key: string] - Cualquier otra propiedad adicional.
 */
type ImageWithFallbackProps = {
  src: string;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
  [key: string]: any;
};


/**
 * Componente de imagen con fallback.
 * Muestra una imagen y, si falla la carga, muestra una imagen alternativa.
 *
 * @param {ImageWithFallbackProps} props - Propiedades del componente.
 * @returns {JSX.Element} Elemento de imagen con fallback.
 */
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = '/W.png',
  alt = '',
  className,
  ...props
}) => {
  const externalOnError = props.onError;
  const resolvedLoading = props.loading ?? 'lazy';
  // Estado para la ruta de la imagen actual
  const [imgSrc, setImgSrc] = useState(src);
  const [shouldLoad, setShouldLoad] = useState(resolvedLoading === 'eager');
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (resolvedLoading === 'eager') {
      setShouldLoad(true);
      return;
    }

    setShouldLoad(false);
  }, [resolvedLoading, src]);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  useEffect(() => {
    if (resolvedLoading === 'eager' || shouldLoad) {
      return;
    }

    const currentImage = imageRef.current;

    if (!currentImage || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: '220px 0px' }
    );

    observer.observe(currentImage);

    return () => observer.disconnect();
  }, [resolvedLoading, shouldLoad, src]);

  return (
    <img
      ref={imageRef}
      src={shouldLoad ? imgSrc : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='}
      alt={alt}
      className={className}
      loading={resolvedLoading}
      decoding={props.decoding ?? 'async'}
      {...props}
      // Si ocurre un error al cargar la imagen, se usa la imagen alternativa
      onError={(event) => {
        if (shouldLoad && imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
        externalOnError?.(event);
      }}
    />
  );
};
