import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

type MobileNavItem = {
  label: string;
  to?: string;
  onClick?: () => void;
  isActive?: boolean;
  tone?: 'default' | 'accent' | 'danger';
};

interface MobileNavMenuProps {
  title: string;
  items: MobileNavItem[];
}

export default function MobileNavMenu({ title, items }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div className="mobile-nav-menu">
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-expanded={isOpen}
        aria-label={isOpen ? `Cerrar menu de ${title}` : `Abrir menu de ${title}`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <>
          <button type="button" className="mobile-nav-backdrop" aria-label="Cerrar menu" onClick={() => setIsOpen(false)} />
          <div className="mobile-nav-panel" role="dialog" aria-modal="true" aria-label={`Menu ${title}`}>
            <div className="mobile-nav-panel-header">
              <div>
                <p className="mobile-nav-kicker">Navegacion</p>
                <strong>{title}</strong>
              </div>
              <button type="button" className="mobile-nav-close" aria-label="Cerrar menu" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <nav className="mobile-nav-links" aria-label={`Enlaces ${title}`}>
              {items.map((item) => {
                const className = `mobile-nav-link${item.isActive ? ' active' : ''}${item.tone ? ` ${item.tone}` : ''}`;

                if (item.to) {
                  return (
                    <Link key={`${item.label}-${item.to}`} to={item.to} className={className} onClick={() => setIsOpen(false)}>
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={className}
                    onClick={() => {
                      item.onClick?.();
                      setIsOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}