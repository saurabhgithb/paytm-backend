const express = require("express");
const router = express.Router();
const z = require("zod");
const { User, Account } = require("../db");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware");

const signupSchema = z.object({
  username: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string().min(6),
});

const signinSchema = z.object({
  username: z.string().email(),
  password: z.string().min(6),
});

const updateSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    password: z.string().min(6),
  })
  .optional();

router.post("/signup", async (req, res) => {
  // get user info
  const userInput = req.body;
  //validation with zod and check duplicate in db
  const { success } = signupSchema.safeParse(userInput);
  const userExists = await User.find({ username: userInput.username });

  try {
    if (!success || userExists.length > 0) {
      return res.status(411).json({
        message: "Email already taken / Incorrect inputs",
      });
    }
    const user = new User(userInput);
    await user.save();

    const userId = user._id;

    await Account.create({
      userId,
      balance: (1 + Math.random() * 10000).toFixed(2),
    });
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);
    res.status(200).json({
      message: "User created successfully",
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    console.log(error);
  }
});

router.post("/signin", async (req, res) => {
  const userInput = req.body;
  const { success } = signinSchema.safeParse(userInput);
  const user = await User.findOne({
    username: userInput.username,
    password: userInput.password,
  });
  try {
    if (!success || !user) {
      return res.status(411).json({
        message: "Error while logging in",
      });
    }

    const userId = user._id;

    const token = jwt.sign({ userId }, process.env.JWT_SECRET);
    res.status(200).json({ token: token, message: "Login Successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    console.log(error);
  }
});

router.put("/update", authMiddleware, async (req, res) => {
  const updateInput = req.body;
  const { success } = updateSchema.safeParse(updateInput);

  if (!success) {
    return res.status(411).json({
      message: "Error while updating information",
    });
  }
  try {
    await User.findOneAndUpdate({ _id: req.userId }, updateInput);
    res.status(200).json({
      message: "Updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
    console.log(error);
  }
});

router.get("/bulk", async (req, res) => {
  const filterQuery = req.query.filter || "";

  const users = await User.find(
    {
      $or: [
        { firstName: { $regex: filterQuery, $options: "i" } },
        { lastName: { $regex: filterQuery, $options: "i" } },
      ],
    },
    "firstName lastName"
  );
  res.status(200).json({ users });
});

module.exports = router;
