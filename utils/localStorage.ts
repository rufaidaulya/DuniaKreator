export interface SavedAvatar {
  id: string;
  name: string;
  imageUrl: string;
  prompt: string;
}

export interface SavedProduct {
  id: string;
  name: string;
  imageUrl: string;
  dna: string; // The product DNA / description
}

export interface SavedLocation {
  id: string;
  name: string;
  prompt: string;
  imageUrl: string;
}


const AVATARS_STORAGE_KEY = 'kreator-ai-saved-avatars';
export const MAX_AVATARS = 10;

const PRODUCTS_STORAGE_KEY = 'kreator-ai-saved-products';
export const MAX_PRODUCTS = 10;

const LOCATIONS_STORAGE_KEY = 'kreator-ai-saved-locations';
export const MAX_LOCATIONS = 10;


const defaultAvatars: SavedAvatar[] = [
  {
    id: 'default-siti',
    name: 'Siti',
    imageUrl: 'https://i.postimg.cc/BQqbCZGD/download-8.jpg',
    prompt: 'A photorealistic portrait of an East Asian woman in her early 20s, facing the camera, with an oval face, soft jawline, and subtle cheekbones. She has large, almond-shaped deep brown eyes with noticeable double eyelids, long dark eyelashes, and naturally arched eyebrows. Her nose is small and straight with a gently rounded tip. Her lips are medium-full, gently curved with a defined cupid\'s bow, holding a soft, closed-mouth smile. Her thick, long, dark wavy hair is parted slightly off-center. She has smooth, warm medium skin tone with a healthy glow.'
  },
  {
    id: 'default-hendra',
    name: 'Hendra',
    imageUrl: 'https://i.postimg.cc/zDw3Wb48/download-7.jpg',
    prompt: 'A photorealistic portrait of an East Asian man in his early to mid-20s with a slender, oval face and a defined jawline, facing the camera. He has deep-set, dark brown, almond-shaped eyes with straight eyebrows. He has a straight, moderately sized nose and naturally full lips with a subtle cupid\'s bow. His skin is smooth with a warm undertone. He has thick, shoulder-length wavy black hair parted slightly off-center, styled loosely around his face. He has a neutral, calm expression.'
  }
];


// --- Saved Avatars ---

export const getSavedAvatars = (): SavedAvatar[] => {
  try {
    const storedAvatars = localStorage.getItem(AVATARS_STORAGE_KEY);
    if (storedAvatars === null) {
      // First time loading the app, or localStorage was cleared.
      // Initialize with default avatars.
      localStorage.setItem(AVATARS_STORAGE_KEY, JSON.stringify(defaultAvatars));
      return defaultAvatars;
    }
    return JSON.parse(storedAvatars);
  } catch (error) {
    console.error("Could not parse saved avatars from localStorage:", error);
    // If there's an error, fall back to defaults to ensure the app is usable.
    localStorage.setItem(AVATARS_STORAGE_KEY, JSON.stringify(defaultAvatars));
    return defaultAvatars;
  }
};

export const saveAvatar = (avatar: SavedAvatar): void => {
  const currentAvatars = getSavedAvatars();
  if (currentAvatars.length >= MAX_AVATARS) {
    throw new Error(`Batas maksimal ${MAX_AVATARS} avatar telah tercapai. Hapus avatar lama untuk menyimpan yang baru.`);
  }
  const updatedAvatars = [avatar, ...currentAvatars];
  localStorage.setItem(AVATARS_STORAGE_KEY, JSON.stringify(updatedAvatars));
};

export const deleteAvatar = (avatarId: string): void => {
  const currentAvatars = getSavedAvatars();
  const updatedAvatars = currentAvatars.filter(avatar => avatar.id !== avatarId);
  localStorage.setItem(AVATARS_STORAGE_KEY, JSON.stringify(updatedAvatars));
};


// --- Saved Products ---

export const getSavedProducts = (): SavedProduct[] => {
  try {
    const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return storedProducts ? JSON.parse(storedProducts) : [];
  } catch (error) {
    console.error("Could not parse saved products from localStorage:", error);
    return [];
  }
};

export const saveProduct = (product: SavedProduct): void => {
  const currentProducts = getSavedProducts();
  if (currentProducts.length >= MAX_PRODUCTS) {
    throw new Error(`Batas maksimal ${MAX_PRODUCTS} produk telah tercapai. Hapus produk lama untuk menyimpan yang baru.`);
  }
  const updatedProducts = [product, ...currentProducts];
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
};

export const deleteProduct = (productId: string): void => {
  const currentProducts = getSavedProducts();
  const updatedProducts = currentProducts.filter(product => product.id !== productId);
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
};

// --- Saved Locations ---

export const getSavedLocations = (): SavedLocation[] => {
  try {
    const storedLocations = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    return storedLocations ? JSON.parse(storedLocations) : [];
  } catch (error) {
    console.error("Could not parse saved locations from localStorage:", error);
    return [];
  }
};

export const saveLocation = (location: SavedLocation): void => {
  const currentLocations = getSavedLocations();
  if (currentLocations.length >= MAX_LOCATIONS) {
    throw new Error(`Batas maksimal ${MAX_LOCATIONS} lokasi telah tercapai. Hapus lokasi lama untuk menyimpan yang baru.`);
  }
  const updatedLocations = [location, ...currentLocations];
  localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updatedLocations));
};

export const deleteLocation = (locationId: string): void => {
  const currentLocations = getSavedLocations();
  const updatedLocations = currentLocations.filter(loc => loc.id !== locationId);
  localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updatedLocations));
};