import { api, type ProductCategoryRecord } from '../services/api';

export const DEFAULT_CATEGORIES: ProductCategoryRecord[] = [
  { id: 'collares', nombre: 'Collares' },
  { id: 'aretes', nombre: 'Aretes' },
  { id: 'pulseras', nombre: 'Pulseras' },
  { id: 'anillos', nombre: 'Anillos' },
  { id: 'paquetes', nombre: 'Set de accesorios' },
];

export function getCategoryLabel(categories: ProductCategoryRecord[], id: string) {
  return categories.find((category) => category.id === id)?.nombre ?? id;
}

export function getCategoryIcon(id: string) {
  const icons: Record<string, string> = {
    collares: '◆',
    aretes: '✦',
    pulseras: '◉',
    anillos: '○',
    paquetes: '□',
  };

  return icons[id] ?? '✦';
}

export async function loadCategories() {
  try {
    const categories = await api.getCategories();
    return categories.map((category) => (
      category.id === 'paquetes'
        ? { ...category, nombre: 'Set de accesorios' }
        : category
    ));
  } catch {
    return DEFAULT_CATEGORIES;
  }
}
