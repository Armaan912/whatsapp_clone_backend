import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  console.log("🔐 authMiddleware called for:", req.path);
  console.log("📋 Request headers:", {
    authorization: req.headers.authorization ? "Bearer ***" : "missing",
    "content-type": req.headers["content-type"],
    "user-agent": req.headers["user-agent"]?.substring(0, 50) + "..."
  });
  console.log("📋 Full request body:", req.body);
  console.log("📋 Request method:", req.method);

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ Unauthorized: token missing");
    return res.status(401).json({ message: "Unauthorized: token missing" });
  }

  const token = authHeader.split(" ")[1];
  console.log("🔑 Token extracted, length:", token.length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified, user ID:", decoded.id);
    console.log("✅ Decoded token payload:", decoded);
    
    // Ensure the user ID is properly set
    if (!decoded.id) {
      console.log("❌ Token missing user ID");
      return res.status(401).json({ message: "Unauthorized: invalid token format" });
    }
    
    req.user = { id: decoded.id };
    console.log("✅ User object set in request:", req.user);
    next();
  } catch (err) {
    console.error("❌ Token verify error:", err);
    console.error("📊 Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

export default authMiddleware;
