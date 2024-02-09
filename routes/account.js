const express = require("express");
const authMiddleware = require("../middleware");
const { Account } = require("../db");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({ userId: req.userId });
  if (!account) {
    return res.json({ message: "No account found" });
  }
  res.status(200).json({ balance: account.balance });
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  const { to, amount } = req.body;
  if (!mongoose.isValidObjectId(to)) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Invalid Id" });
  }
  if (amount < 0) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Negative Amount" });
  }

  const toAccount = await Account.find({ userId: to }).session(session);

  if (!toAccount) {
    await session.abortTransaction();

    return res.status(400).json({
      message: "Invalid account",
    });
  }
  const from = req.userId;

  const { balance } = await Account.findOne(
    { userId: from },
    "balance"
  ).session(session);

  if (balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Insufficient Balance" });
  }

  await Account.updateOne(
    { userId: from },
    { $inc: { balance: -amount } }
  ).session(session);

  await Account.updateOne(
    { userId: to },
    { $inc: { balance: amount } }
  ).session(session);

  await session.commitTransaction();

  res.json({
    message: "Transfer successful",
  });
});

module.exports = router;
