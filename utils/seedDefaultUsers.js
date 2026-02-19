const User = require("../models/User");

const ensureUser = async ({ name, email, password, role }) => {
  const exists = await User.findOne({ email });
  if (exists) return false;

  await User.create({
    name,
    email,
    password,
    role,
  });

  return true;
};

const seedDefaultUsers = async () => {
  const adminData = {
    name: process.env.DEFAULT_ADMIN_NAME || "Admin User",
    email: process.env.DEFAULT_ADMIN_EMAIL || "admin@smartmarket.com",
    password: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123",
    role: "admin",
  };

  const sellerData = {
    name: process.env.DEFAULT_SELLER_NAME || "Seller User",
    email: process.env.DEFAULT_SELLER_EMAIL || "seller@smartmarket.com",
    password: process.env.DEFAULT_SELLER_PASSWORD || "Seller@123",
    role: "seller",
  };

  const createdAdmin = await ensureUser(adminData);
  const createdSeller = await ensureUser(sellerData);

  if (createdAdmin) console.log(`Default admin created: ${adminData.email}`);
  if (createdSeller) console.log(`Default seller created: ${sellerData.email}`);
};

module.exports = seedDefaultUsers;
