exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Guard in case auth middleware was not applied before authorize
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized request",
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. You are not allowed to perform this action",
      });
    }
    next();
  };
};
