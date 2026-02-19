const Category = require("../models/Category");
const mongoose = require("mongoose");

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .select("name parentCategory")
      .sort({ name: 1 });

    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, parentCategory } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const normalizedName = name.trim();
    const existing = await Category.findOne({ name: normalizedName });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const payload = { name: normalizedName };
    if (parentCategory !== undefined && parentCategory !== null && parentCategory !== "") {
      if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
        return res.status(400).json({ message: "Invalid parent category id" });
      }
      payload.parentCategory = parentCategory;
    }

    const category = await Category.create(payload);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create category",
      error: error.message,
    });
  }
};

