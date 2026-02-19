const Category = require("../models/Category");

const DEFAULT_CATEGORY_NAMES = [
  "Electronics",
  "Fashion",
  "Home",
  "Beauty",
  "Sports",
];

const seedDefaultCategories = async () => {
  for (const name of DEFAULT_CATEGORY_NAMES) {
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({ name });
      console.log(`Default category created: ${name}`);
    }
  }
};

module.exports = seedDefaultCategories;

