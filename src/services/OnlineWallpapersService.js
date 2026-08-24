/**
 * Online Wallpaper Search Service ported from services/OnlineWallpapers.qml
 * Queries Wallhaven and Unsplash public APIs for high-resolution desktop wallpapers.
 */

export const OnlineWallpapersService = {
  /**
   * Search Wallhaven for wallpapers
   * @param {string} query - Search keyword (e.g., 'anime', 'minimalist', 'cyberpunk', 'nature')
   * @param {string} category - 'general' | 'anime' | 'people'
   * @param {number} page - page number
   */
  async searchWallhaven(query = '', category = 'general', page = 1) {
    try {
      // categories: 100 = general, 010 = anime, 001 = people
      let categories = '100';
      if (category === 'anime') categories = '010';
      else if (category === 'people') categories = '001';
      else if (category === 'all') categories = '111';

      const q = query ? encodeURIComponent(query) : '';
      const url = `https://wallhaven.cc/api/v1/search?q=${q}&categories=${categories}&purity=100&sorting=toplist&page=${page}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data?.data) return [];

      return data.data.map((item) => ({
        id: item.id,
        thumb: item.thumbs?.large || item.thumbs?.small,
        full: item.path,
        resolution: item.resolution,
        colors: item.colors,
        category: item.category,
        provider: 'wallhaven',
      }));
    } catch (err) {
      console.warn('Wallhaven fetch error:', err);
      return [];
    }
  },

  /**
   * Fallback curated wallpapers
   */
  getCuratedPresets() {
    return [
      { id: 'end4-def', name: 'Default end4', thumb: '/assets/images/default_wallpaper.png', full: '/assets/images/default_wallpaper.png', category: 'Material' },
      { id: 'end4-1', name: 'Expressive Red', thumb: '/screenshots/1.png', full: '/screenshots/1.png', category: 'Showcase' },
      { id: 'end4-2', name: 'Expressive Violet', thumb: '/screenshots/2.png', full: '/screenshots/2.png', category: 'Showcase' },
      { id: 'end4-3', name: 'Expressive Indigo', thumb: '/screenshots/3.png', full: '/screenshots/3.png', category: 'Showcase' },
      { id: 'end4-4', name: 'Expressive Green', thumb: '/screenshots/4.png', full: '/screenshots/4.png', category: 'Showcase' },
      { id: 'end4-5', name: 'Expressive Cyan', thumb: '/screenshots/5.png', full: '/screenshots/5.png', category: 'Showcase' },
      { id: 'end4-6', name: 'Expressive Amber', thumb: '/screenshots/6.png', full: '/screenshots/6.png', category: 'Showcase' },
      { id: 'uns-1', name: 'Nordic Aurora', thumb: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=400', full: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=2560', category: 'Nature' },
      { id: 'uns-2', name: 'Tokyo Rain', thumb: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=400', full: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2560', category: 'Cyberpunk' },
      { id: 'uns-3', name: 'Fuji Sunset', thumb: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400', full: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2560', category: 'Anime' },
      { id: 'uns-4', name: 'Mountain Mist', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400', full: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2560', category: 'Nature' },
    ];
  },
};
