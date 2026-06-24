import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { getCategoryIcon } from '../utils/iconHelper'; // I'll create this helper
import Footer from '../components/Footer';

export default function Home() {
  const [hero, setHero] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [heroRes, catRes] = await Promise.all([
          api.get('/hero/public').catch(() => null),
          api.get('/categories').catch(() => null),
        ]);
        if (!mounted) return;
        if (heroRes) setHero(heroRes.data);
        if (catRes && catRes.data) {
          setCategories(catRes.data);
        }
      } catch (e) {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="rounded-xl overflow-hidden mb-6">
          <div className="h-44 sm:h-56 lg:h-64 w-full bg-gray-200 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold mb-4">Our Menu</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const heroTitle = hero?.title || 'Nanban Restaurant';
  const heroSubtitle = hero?.subtitle || "Taste Nagercoil's favourites, delivered to you.";
  const heroBadge1 = hero?.badge1 || 'Curated Specials';
  const heroBadge2 = hero?.badge2 || 'Fast Delivery';
  const heroBadge3 = hero?.badge3 || 'Dine-in';
  const heroImage = hero?.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop';

  return (
    <div className="animate-fade-up">
      {/* Hero Banner */}
      <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
        <div className="relative h-48 sm:h-64 lg:h-72 w-full">
          <img
            src={heroImage}
            alt="Hero"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
          <div className="relative h-full flex items-center px-6 sm:px-10">
            <div className="text-white max-w-xl">
              <p className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-red-600 text-white uppercase shadow-sm mb-2">
                Limited Time Only
              </p>
              <div className="text-2xl sm:text-4xl font-black leading-tight drop-shadow tracking-tight">
                {heroTitle.toUpperCase()}
                <span className="block text-lg sm:text-2xl font-bold text-orange-400 mt-1">{heroSubtitle}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] sm:text-xs text-white font-semibold">
                <span className="bg-black/50 px-2 py-1 border border-white/20 rounded">{heroBadge1}</span>
                <span className="bg-black/50 px-2 py-1 border border-white/20 rounded">{heroBadge2}</span>
                <span className="bg-black/50 px-2 py-1 border border-white/20 rounded">{heroBadge3}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Menu Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Explore Menu</h2>
          <button onClick={() => navigate('/menu')} className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center">
            See All <span className="ml-1 text-lg leading-none">›</span>
          </button>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {categories.map((c) => {
              const Icon = getCategoryIcon(c.name);
              return (
                <button
                  key={c.key}
                  onClick={() => navigate(`/menu?category=${c.key}`)}
                  className="flex flex-col items-center justify-center w-full group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 rounded-full overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-orange-50 dark:bg-gray-800 flex items-center justify-center group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    {c?.image ? (
                      <img 
                        src={c.image} 
                        alt={c.name} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'block';
                        }} 
                      />
                    ) : null}
                    <Icon 
                      size={32} 
                      className="text-orange-500" 
                      strokeWidth={1.5} 
                      style={{ display: c?.image ? 'none' : 'block' }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 text-center leading-tight truncate w-full">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No categories found.</div>
        )}
      </div>

      {/* Dynamic Footer */}
      <div className="mt-12 -mx-4 sm:-mx-6 lg:-mx-8 -mb-6">
        <Footer />
      </div>
    </div>
  );
}
