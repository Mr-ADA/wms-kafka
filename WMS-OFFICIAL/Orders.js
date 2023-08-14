//============================= DEVELOPMENT ENVIRONMENT =========================================
const express = require("express");
const router = express.Router();
const connectToDatabase = require("./database");
const mongoose = require("mongoose");
connectToDatabase();

const orderCounterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 1000 },
});
const orderCounter = mongoose.model("orderCounter", orderCounterSchema);

const orderSchema = new mongoose.Schema({
  orderId: { type: Number, unique: true },
  customerName: String,
  customerAddress: String,
  productName: String,
  orderDate: Date,
  orderStatus: String,
});

orderSchema.pre("save", function (next) {
  const orders = this;
  orderCounter
    .findByIdAndUpdate({ _id: "orderId" }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true })
    .then((counter) => {
      orders.orderId = counter.sequence_value;
      next();
    })
    .catch((error) => {
      console.error("Failed to generate order ID:", error);
      next(error);
    });
});

// Replace Index with createIndex
orderSchema.set("autoIndex", false);
orderSchema.index({ orderId: 1 }, { unique: true, sparse: true });
const Orders = mongoose.model("Orders", orderSchema, "Orders");

router.get("/", (req, res) => {
  console.log("================================ ORDER MESSAGE IS SENT! ======================================");
  Orders.find({}, (err, ordersList) => {
    if (err) {
      console.error("Failed to fetch inventory data:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(ordersList);
  });
});

module.exports = router;
