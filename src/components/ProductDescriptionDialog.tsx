import { useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCopCurrency } from '../utils/currency';
import type { ProductCatalogItem } from '../utils/productCatalog';
import { ImageWithFallback } from './figma/ImageWithFallback';

type ProductDescriptionDialogProps = {
  product: ProductCatalogItem | null;
  onClose: () => void;
};

export default function ProductDescriptionDialog({ product, onClose }: ProductDescriptionDialogProps) {
  useEffect(() => {
    if (!product) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, product]);

  if (!product) return null;

  return (
    <div className="product-description-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="product-description-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-description-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="product-description-close" onClick={onClose} aria-label="Cerrar detalle">
          <X aria-hidden="true" />
        </button>
        <div className="product-description-media">
          <ImageWithFallback src={product.image} alt={product.name} />
        </div>
        <div className="product-description-content">
          <span className="product-description-code">{product.code}</span>
          <h2 id="product-description-title">{product.name}</h2>
          <p>{product.description || 'Este producto todavía no tiene una descripción disponible.'}</p>
          <strong>{formatCopCurrency(product.price)}</strong>
        </div>
      </section>
    </div>
  );
}
