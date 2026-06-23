// We use Vite's import.meta.glob to eagerly load all images in the assets folder.
// This allows us to dynamically resolve them based on the item name without writing explicit imports for every single one.
// The `{ query: '?url', import: 'default' }` ensures it loads the asset URL correctly across different Vite versions.
const images = import.meta.glob('../assets/*.{jpg,jpeg,png,svg}', { eager: true, query: '?url', import: 'default' });

export const getLocalImageSrc = (itemName) => {
  // Try to match the exact filename based on the item name. 
  // E.g., 'Grilled Chicken' -> 'grilled-chicken'
  if (itemName) {
    const formattedName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Check common extensions
    const extensions = ['.jpg', '.jpeg', '.png', '.svg'];
    for (const ext of extensions) {
      const path = `../assets/${formattedName}${ext}`;
      if (images[path]) {
        return images[path];
      }
    }
  }

  // Fallback to a default image from assets if available
  return images['../assets/default-food.jpg'] || images['../assets/default.jpg'] || images['../assets/default.png'] || '/logo.svg'; 
};

export const getImageUrl = (imagePath, itemName) => {
  if (imagePath) {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Remove trailing slash from baseUrl and leading slash from imagePath
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const cleanPath = imagePath.replace(/^\/+/, '');
    
    return `${cleanBase}/${cleanPath}`;
  }
  
  // If no image path provided by backend, try the local name-based resolution
  return getLocalImageSrc(itemName);
};
