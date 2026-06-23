const mongoose = require('mongoose');
const FoodItem = require('./models/foodItem'); // Ensure file name matches exactly (case-sensitive)

const menuData = [
  // Tiffin
  { name: "Parotta", description: "Soft layered parotta", price: 15, category: "Tiffin" },
  { name: "Chappathi", description: "Fresh wheat chappathi", price: 15, category: "Tiffin" },
  { name: "Appam", description: "Soft traditional appam", price: 0, category: "Tiffin" },
  { name: "Dosa", description: "Crispy classic dosa", price: 0, category: "Tiffin" },
  { name: "Special Dosa", description: "Special dosa variety", price: 0, category: "Tiffin" },
  { name: "Ghee Dosa", description: "Ghee roasted crispy dosa", price: 60, category: "Tiffin" },
  
  // Egg Items
  { name: "Single Omlet", description: "Tasty single egg omlet", price: 20, category: "Egg Items" },
  { name: "Double Omlet", description: "Double egg fluffy omlet", price: 35, category: "Egg Items" },
  { name: "Single Set", description: "Standard egg set", price: 15, category: "Egg Items" },
  { name: "Uruttu", description: "Special egg preparation", price: 30, category: "Egg Items" },
  { name: "EGC Fry", description: "Spicy egg fry", price: 30, category: "Egg Items" },

  // Parotta Items
  { name: "Parotta", description: "Classic layered parotta", price: 15, category: "Parotta Items" },
  { name: "Veechi Parotta", description: "Crispy veechi parotta", price: 20, category: "Parotta Items" },
  { name: "Egg Veechi Parotta", description: "Egg filled veechi parotta", price: 60, category: "Parotta Items" },
  { name: "Chicken Kothu Parotta", description: "Spicy chicken kothu", price: 170, category: "Parotta Items" },
  { name: "Beef Kothu Parotta", description: "Spicy beef kothu", price: 170, category: "Parotta Items" },
  { name: "Veji Kothu Parotta", description: "Veggie delight kothu", price: 90, category: "Parotta Items" },

  // Idiyappam
  { name: "Idiyappam", description: "Steamed string hoppers", price: 12, category: "Idiyappam Items" },
  { name: "Chicken Idiyappam Kothu", description: "Chicken infused idiyappam", price: 170, category: "Idiyappam Items" },
  { name: "Beef Idiyappam Kothu", description: "Beef infused idiyappam", price: 170, category: "Idiyappam Items" },

  // Beef Specialties
  { name: "Beef Curry", description: "Spicy beef gravy", price: 90, category: "Beef Specialties" },
  { name: "Beef Sukka", description: "Dry roasted beef", price: 100, category: "Beef Specialties" },
  { name: "Beef", description: "Signature beef dish", price: 110, category: "Beef Specialties" },
  { name: "Beef Sukka Rost", description: "Roasted beef delicacy", price: 120, category: "Beef Specialties" },
  { name: "Lopa (Chicken Beef)", description: "Mixed meat special", price: 160, category: "Beef Specialties" },

  // Chicken Specialties
  { name: "Chicken Chapse", description: "Savory chicken dish", price: 100, category: "Chicken Specialties" },
  { name: "Kothu Kozhi", description: "Minced chicken special", price: 130, category: "Chicken Specialties" },
  { name: "Chicken Fry", description: "Crispy fried chicken", price: 100, category: "Chicken Specialties" },
  { name: "Chicken Pakkoda", description: "Crunchy chicken fritters", price: 100, category: "Chicken Specialties" },
  { name: "Kozhi Eral", description: "Chicken and shrimp special", price: 70, category: "Chicken Specialties" },
  { name: "Grill Chicken", description: "Grilled to perfection", price: 450, category: "Chicken Specialties" },

  // Chinese Recipes
  { name: "Chicken Rice", description: "Fried rice with chicken", price: 120, category: "Chinese Recipes" },
  { name: "Beef Rice", description: "Fried rice with beef", price: 120, category: "Chinese Recipes" },
  { name: "Egg Rice", description: "Classic egg fried rice", price: 90, category: "Chinese Recipes" },
  { name: "Vej Rice", description: "Vegetable fried rice", price: 80, category: "Chinese Recipes" },
  { name: "Noodles Chicken", description: "Chicken tossed noodles", price: 120, category: "Chinese Recipes" },
  { name: "Beef Noodles", description: "Beef tossed noodles", price: 120, category: "Chinese Recipes" },
  { name: "Egg Noodles", description: "Classic egg noodles", price: 90, category: "Chinese Recipes" },
  { name: "Vej Noodles", description: "Veggie noodles", price: 80, category: "Chinese Recipes" },
  { name: "Pepper Chicken", description: "Spicy pepper chicken", price: 160, category: "Chinese Recipes" },
  { name: "Chilli Chicken", description: "Indo-chinese chilli chicken", price: 150, category: "Chinese Recipes" },
  { name: "Ginger Chicken", description: "Zesty ginger chicken", price: 150, category: "Chinese Recipes" },
  { name: "Garlic Chicken", description: "Garlic infused chicken", price: 150, category: "Chinese Recipes" },
  { name: "Kadai Chicken", description: "Traditional kadai chicken", price: 60, category: "Chinese Recipes" },
  { name: "Chettinadu Chicken", description: "Spicy Chettinad style", price: 150, category: "Chinese Recipes" },
  { name: "Chicken Manjoorian", description: "Tangy chicken manchurian", price: 150, category: "Chinese Recipes" },
  { name: "Chilli Beef", description: "Spicy chilli beef", price: 150, category: "Chinese Recipes" }
];

// Connection URI
mongoose.connect('mongodb+srv://foodqr:foodqr@foodqr.pwwsipn.mongodb.net/foodQR')
  .then(async () => {
    console.log("Connected to MongoDB...");
    await FoodItem.insertMany(menuData);
    console.log("Menu items added successfully!");
    process.exit();
  })
  .catch(err => {
    console.error("Database connection error:", err);
    process.exit(1);
  });