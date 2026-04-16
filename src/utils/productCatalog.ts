export type ProductCategory = 'collares' | 'aretes' | 'pulseras';

export interface ProductCatalogItem {
  id: number;
  code: string;
  category: ProductCategory;
  name: string;
  description: string;
  units: number;
  price: number;
  image: string;
}

export const PRODUCT_STORAGE_KEY = 'wuepa-admin-products';

const accessoryImage = (fileName: string) => new URL(`../../ejemplosaccesorios/${fileName}`, import.meta.url).href;

const productImageById: Record<number, string> = {
  1: accessoryImage('Collarcorazon.png'),
  2: accessoryImage('collar.png'),
  3: accessoryImage('Collarmariposa.png'),
  4: accessoryImage('collarperlas.png'),
  5: accessoryImage('collaroro.png'),
  6: accessoryImage('aretesperlas.png'),
  7: accessoryImage('aretemariposa.png'),
  8: accessoryImage('Aretesflor.png'),
  9: accessoryImage('areteestrellarosa.png'),
  10: accessoryImage('aretesflornegra.png'),
  11: accessoryImage('pulseraperlas.png'),
  12: accessoryImage('pulseraarcoiris.png'),
  13: accessoryImage('pulseraperlas.png'),
  14: accessoryImage('pulseraarcoiris.png'),
  15: accessoryImage('pulseraperlas.png'),
};

const legacyCatalogImages = new Set([
  '/collar.png',
  '/collar-min.png',
  '/collar-diamante.png',
  '/collar-cadena.png',
  '/collar-oro.png',
  '/arete.png',
  '/aretes-gota.png',
  '/arete-flor.png',
  '/arete-cristal.png',
  '/aretes-minimal.png',
  '/pulsera.png',
  '/pulsera-doble.png',
  '/pulsera-perlas.png',
  '/pulsera-plata.png',
  '/pulsera-oro.png',
]);

function normalizeProductImage(product: ProductCatalogItem) {
  const preferredImage = productImageById[product.id];

  if (!preferredImage) {
    return product.image;
  }

  if (!product.image || legacyCatalogImages.has(product.image)) {
    return preferredImage;
  }

  return product.image;
}

export function getDefaultProductImage(category: ProductCategory) {
  if (category === 'aretes') {
    return accessoryImage('aretesperlas.png');
  }

  if (category === 'pulseras') {
    return accessoryImage('pulseraperlas.png');
  }

  return accessoryImage('Collarcorazon.png');
}

function getCategoryCodePrefix(category: ProductCategory) {
  if (category === 'aretes') {
    return 'ARE';
  }

  if (category === 'pulseras') {
    return 'PUL';
  }

  return 'COL';
}

export function generateProductCode(category: ProductCategory, id: number) {
  return `WUE-${getCategoryCodePrefix(category)}-${String(id).padStart(3, '0')}`;
}

function normalizeProductCode(product: Pick<ProductCatalogItem, 'id' | 'category' | 'code'>) {
  const normalizedCode = product.code.trim().toUpperCase();
  return normalizedCode || generateProductCode(product.category, product.id);
}

export const initialProductsCatalog: ProductCatalogItem[] = [
  {
    id: 1,
    code: generateProductCode('collares', 1),
    category: 'collares',
    name: 'Collar Corazon',
    description: 'Elegante collar con diseño central y acabado brillante.',
    units: 12,
    price: 25,
    image: productImageById[1],
  },
  {
    id: 2,
    code: generateProductCode('collares', 2),
    category: 'collares',
    name: 'Collar Minimal',
    description: 'Pieza ligera para uso diario con estilo sofisticado.',
    units: 8,
    price: 22,
    image: productImageById[2],
  },
  {
    id: 3,
    code: generateProductCode('collares', 3),
    category: 'collares',
    name: 'Collar Diamante',
    description: 'Cadena elegante con detalle protagonista de alto brillo.',
    units: 5,
    price: 35,
    image: productImageById[3],
  },
  {
    id: 4,
    code: generateProductCode('collares', 4),
    category: 'collares',
    name: 'Collar Cadena',
    description: 'Diseño delicado con presencia sutil y acabado dorado.',
    units: 10,
    price: 23,
    image: productImageById[4],
  },
  {
    id: 5,
    code: generateProductCode('collares', 5),
    category: 'collares',
    name: 'Collar Oro',
    description: 'Collar de presencia clasica con tono dorado elegante.',
    units: 7,
    price: 29,
    image: productImageById[5],
  },
  {
    id: 6,
    code: generateProductCode('aretes', 6),
    category: 'aretes',
    name: 'Aretes Perla',
    description: 'Aretes delicados con perla y silueta atemporal.',
    units: 14,
    price: 18,
    image: productImageById[6],
  },
  {
    id: 7,
    code: generateProductCode('aretes', 7),
    category: 'aretes',
    name: 'Aretes Gota',
    description: 'Modelo estilizado con caida suave y brillo elegante.',
    units: 9,
    price: 21,
    image: productImageById[7],
  },
  {
    id: 8,
    code: generateProductCode('aretes', 8),
    category: 'aretes',
    name: 'Arete Flor',
    description: 'Diseño floral para looks frescos y femeninos.',
    units: 11,
    price: 16,
    image: productImageById[8],
  },
  {
    id: 9,
    code: generateProductCode('aretes', 9),
    category: 'aretes',
    name: 'Arete Cristal',
    description: 'Acabado brillante con cristales que destacan la pieza.',
    units: 6,
    price: 24,
    image: productImageById[9],
  },
  {
    id: 10,
    code: generateProductCode('aretes', 10),
    category: 'aretes',
    name: 'Aretes Minimal',
    description: 'Par sobrio y combinable para cualquier ocasion.',
    units: 13,
    price: 19,
    image: productImageById[10],
  },
  {
    id: 11,
    code: generateProductCode('pulseras', 11),
    category: 'pulseras',
    name: 'Pulsera Clasica',
    description: 'Pulsera elegante con silueta limpia y versatil.',
    units: 10,
    price: 20,
    image: productImageById[11],
  },
  {
    id: 12,
    code: generateProductCode('pulseras', 12),
    category: 'pulseras',
    name: 'Pulsera Doble',
    description: 'Composicion de doble cadena para un look moderno.',
    units: 7,
    price: 24,
    image: productImageById[12],
  },
  {
    id: 13,
    code: generateProductCode('pulseras', 13),
    category: 'pulseras',
    name: 'Pulsera Perlas',
    description: 'Pulsera delicada con perlas y terminacion refinada.',
    units: 9,
    price: 26,
    image: productImageById[13],
  },
  {
    id: 14,
    code: generateProductCode('pulseras', 14),
    category: 'pulseras',
    name: 'Pulsera Plata',
    description: 'Diseño limpio en tono plata para uso diario.',
    units: 4,
    price: 30,
    image: productImageById[14],
  },
  {
    id: 15,
    code: generateProductCode('pulseras', 15),
    category: 'pulseras',
    name: 'Pulsera Oro',
    description: 'Pulsera con acabado dorado y presencia elegante.',
    units: 6,
    price: 28,
    image: productImageById[15],
  },
];

function isProductCatalogItem(value: unknown): value is ProductCatalogItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Partial<ProductCatalogItem>;

  return typeof product.id === 'number'
    && (product.category === 'collares' || product.category === 'aretes' || product.category === 'pulseras')
    && typeof product.name === 'string'
    && typeof product.description === 'string'
    && typeof product.units === 'number'
    && typeof product.price === 'number'
    && typeof product.image === 'string';
}

export function loadProductsCatalog(): ProductCatalogItem[] {
  if (typeof window === 'undefined') {
    return initialProductsCatalog;
  }

  const rawProducts = window.localStorage.getItem(PRODUCT_STORAGE_KEY);

  if (!rawProducts) {
    return initialProductsCatalog;
  }

  try {
    const parsedProducts = JSON.parse(rawProducts) as unknown;

    if (!Array.isArray(parsedProducts)) {
      return initialProductsCatalog;
    }

    const sanitizedProducts = parsedProducts
      .filter(isProductCatalogItem)
      .map((product) => ({
        ...product,
        code: normalizeProductCode(product),
        image: normalizeProductImage(product),
      }));

    return sanitizedProducts.length > 0 ? sanitizedProducts : initialProductsCatalog;
  } catch {
    return initialProductsCatalog;
  }
}

export function saveProductsCatalog(products: ProductCatalogItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
}

export function resetProductsCatalog() {
  saveProductsCatalog(initialProductsCatalog);
  return initialProductsCatalog;
}

export function groupProductsByCategory(products: ProductCatalogItem[]) {
  return {
    collares: products.filter((product) => product.category === 'collares'),
    aretes: products.filter((product) => product.category === 'aretes'),
    pulseras: products.filter((product) => product.category === 'pulseras'),
  } as const;
}

export function createEmptyProduct(products: ProductCatalogItem[]): ProductCatalogItem {
  const nextId = products.reduce((highestId, product) => Math.max(highestId, product.id), 0) + 1;

  return {
    id: nextId,
    code: generateProductCode('collares', nextId),
    category: 'collares',
    name: '',
    description: '',
    units: 0,
    price: 0,
    image: getDefaultProductImage('collares'),
  };
}