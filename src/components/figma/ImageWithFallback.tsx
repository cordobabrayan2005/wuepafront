
// Importa React y los hooks necesarios
import React, { useEffect, useState } from 'react';


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
  // Estado para la ruta de la imagen actual
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      // Si ocurre un error al cargar la imagen, se usa la imagen alternativa
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
      {...props}
    />
  );
};
