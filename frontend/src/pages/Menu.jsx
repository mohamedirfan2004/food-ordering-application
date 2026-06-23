import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import MenuItemCard from '../components/MenuItemCard';
import { getCategoryIcon } from '../utils/iconHelper';
import { isItemAvailableNow } from '../utils/availability';

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const activeCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [menuRes, catRes] = await Promise.all([
          api.get('/menu'),
          api.get('/categories').catch(() => null),
        ]);
        if (!mounted) return;
        setItems(menuRes.data);
        if (catRes && catRes.data) {
          setCategories([{ key: 'all', name: 'All' }, ...catRes.data]);
        } else {
           // Fallback if no categories API exists
           const uniqueCats = Array.from(new Set(menuRes.data.map(i => i.category))).filter(Boolean);
           setCategories([{ key: 'all', name: 'All' }, ...uniqueCats.map(c => ({ key: c, name: c }))]);
        }
      } catch (e) {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleCategoryClick = (key) => {
    setSearchParams({ category: key });
    // Scroll to top of right pane when category changes
    document.getElementById('menu-items-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(it => it.category === activeCategory || it.category === categories.find(c => c.key === activeCategory)?.name);
    }
    // Optionally sort items (e.g., available ones first)
    return filtered.sort((a, b) => {
       const aAvail = isItemAvailableNow(a);
       const bAvail = isItemAvailableNow(b);
       if (aAvail === bAvail) return 0;
       return aAvail ? -1 : 1;
    });
  }, [items, activeCategory, categories]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] animate-pulse">
        <div className="w-1/4 min-w-[80px] bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800" />
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] -mx-4 lg:-mx-8 -my-6 bg-gray-50 dark:bg-gray-950 overflow-hidden animate-fade-up">
      {/* Left Sidebar: Categories */}
      <div className="w-[85px] sm:w-[120px] shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto no-scrollbar shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)] z-10 pb-20">
        <div className="py-2 flex flex-col gap-1 px-1.5 sm:px-2">
          {categories.map((c) => {
            const isActive = activeCategory === c.key;
            const Icon = getCategoryIcon(c.name);
            return (
              <button
                key={c.key}
                onClick={() => handleCategoryClick(c.key)}
                className={`relative flex flex-col items-center justify-center py-3 sm:py-4 px-1 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-orange-50 dark:bg-orange-950/30 shadow-sm' 
                    : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-600 rounded-r-full" />
                )}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center mb-1.5 transition-transform border-2 ${isActive ? 'bg-orange-100 text-orange-600 border-orange-500 scale-110' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent'}`}>
                  {c.image ? (
                    <img 
                      src={c.image} 
                      alt={c.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'block';
                      }} 
                    />
                  ) : null}
                  <Icon 
                    size={isActive ? 24 : 20} 
                    strokeWidth={isActive ? 2 : 1.5} 
                    style={{ display: c.image ? 'none' : 'block' }}
                  />
                </div>
                <span className={`text-[10px] sm:text-xs text-center leading-tight ${isActive ? 'font-bold text-orange-700 dark:text-orange-400' : 'font-medium text-gray-600 dark:text-gray-400'}`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content: Menu Items */}
      <div id="menu-items-container" className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-3 sm:p-4 pb-24 md:pb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white capitalize">
          {categories.find(c => c.key === activeCategory)?.name || activeCategory}
        </h2>
        
        <div className="flex flex-col gap-3">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <MenuItemCard key={item._id} item={item} />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              No items available in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
