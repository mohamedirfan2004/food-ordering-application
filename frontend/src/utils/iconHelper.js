import { Utensils, Coffee, Pizza, Beef, Fish, Leaf, Drumstick, CupSoda, IceCream, Sandwich } from 'lucide-react';

export function getCategoryIcon(categoryName) {
  if (!categoryName) return Utensils;
  
  const name = categoryName.toLowerCase();
  
  if (name.includes('burger') || name.includes('sandwich')) return Sandwich;
  if (name.includes('pizza')) return Pizza;
  if (name.includes('chicken') || name.includes('meat') || name.includes('beef')) return Drumstick;
  if (name.includes('fish') || name.includes('seafood')) return Fish;
  if (name.includes('veg') || name.includes('salad') || name.includes('healthy')) return Leaf;
  if (name.includes('drink') || name.includes('beverage') || name.includes('soda')) return CupSoda;
  if (name.includes('coffee') || name.includes('tea') || name.includes('cafe')) return Coffee;
  if (name.includes('dessert') || name.includes('ice cream') || name.includes('sweet')) return IceCream;
  
  // Default generic icon
  return Utensils;
}
