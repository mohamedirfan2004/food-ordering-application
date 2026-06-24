import React from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getLocalImageSrc } from '../utils/imageHelper';
import { isItemAvailableNow } from '../utils/availability';

export default function MenuItemCard({ item }) {
  const { addToCart, items: cartItems, updateQty, removeFromCart } = useCart();
  const { addToast } = useToast();

  const inCart = cartItems.find(ci => ci.foodItem === item._id);
  const qty = inCart?.quantity || 0;
  const availableNow = isItemAvailableNow(item);

  // Fallback assuming we might have an isVeg property, otherwise default to veg for UI placeholder
  const isVeg = item.isVeg !== undefined ? item.isVeg : true; 

  return (
    <div className={`flex bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all ${!availableNow ? 'opacity-60 grayscale-[0.2]' : ''}`}>
      {/* Left side: Image */}
      <div className="w-28 sm:w-32 shrink-0 relative bg-gray-50 dark:bg-gray-800">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover absolute inset-0"
          loading="lazy"
          onError={(e) => { 
            e.currentTarget.style.display = 'none';
          }}
        />
        {!availableNow && (
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
             <span className="text-white text-[10px] font-bold uppercase tracking-widest text-center px-1">
               Unavailable
             </span>
           </div>
        )}
      </div>

      {/* Right side: Details */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        
        {/* Top: Title & Indicator */}
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight line-clamp-2">
              {item.name}
            </h3>
            <div className={`shrink-0 w-3.5 h-3.5 border flex items-center justify-center rounded-[2px] mt-0.5 ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
               <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
            </div>
          </div>
          
          {/* Middle: Description */}
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug mb-2">
            {item.description}
          </p>
        </div>

        {/* Bottom: Price & Button */}
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            ₹{item.price}
          </span>
          
          {qty === 0 ? (
            <button
              disabled={!availableNow}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border ${availableNow ? 'border-orange-500 text-orange-600 hover:bg-orange-50 active:scale-95' : 'border-gray-300 text-gray-400'} transition-transform shadow-sm`}
              onClick={() => {
                if (!availableNow) return;
                addToCart({ foodItem: item._id, name: item.name, price: item.price, image: item.image });
                addToast('success', `${item.name} added to cart`);
              }}
            >
              ADD +
            </button>
          ) : (
            <div className="flex items-center gap-2 px-1.5 py-1 rounded-full border border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 shadow-sm">
              <button
                className="w-6 h-6 flex items-center justify-center text-lg font-medium active:scale-95 transition"
                onClick={() => {
                  if (qty <= 1) {
                    removeFromCart(item._id);
                    addToast('success', `${item.name} removed`);
                  } else {
                    updateQty(item._id, qty - 1);
                  }
                }}
              >
                -
              </button>
              <span className="w-4 text-center text-xs font-bold">{qty}</span>
              <button
                className="w-6 h-6 flex items-center justify-center text-lg font-medium active:scale-95 transition"
                onClick={() => {
                  if (!availableNow) return;
                  updateQty(item._id, qty + 1);
                }}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
