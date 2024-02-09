const express = require("express");
const router = express.Router();

const UserRouter = require("./user");
const AccountRouter = require("./account");
const JWT_SECRET = require("../config");
const jwt = require("jsonwebtoken");
const { User } = require("../db");

router.use("/user", UserRouter);
router.use("/account", AccountRouter);

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.json({ message: "Authentication failed." });
    return;
  }

  try {
    const token = authHeader.split(" ")[1] || "";
    if (!token) {
      res.status(403).json({ message: "Invalid Token" });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    res.json({
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(403).json({ message: "Authentication failed." });
  }
});

module.exports = router;
