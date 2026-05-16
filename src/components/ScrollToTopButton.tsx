import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 360);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToStart() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      className={`scroll-top-button ${isVisible ? 'visible' : ''}`}
      onClick={scrollToStart}
      aria-label="Volver al inicio"
    >
      <ArrowUp aria-hidden="true" />
    </button>
  );
}
