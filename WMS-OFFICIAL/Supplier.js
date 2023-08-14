const express = require("express");
const router = express.Router();
const connectToDatabase = require("./database");
const mongoose = require("mongoose");
connectToDatabase();

const supplierCounterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 1000 },
});

const supplierCounter = mongoose.model("supplierCounter", supplierCounterSchema);
const supplierSchema = new mongoose.Schema({
  supplierId: { type: Number, unique: true },
  supplierName: String,
  supplierAddress: String,
  supplierPhone: Number,
  productName: String,
  productCategory: String,
  productPrice: Number,
  productWeight: Number,
  productDescription: String,
});

supplierSchema.pre("save", function (next) {
  const supplier = this;
  supplierCounter
    .findByIdAndUpdate({ _id: "supplierId" }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true })
    .then((counter) => {
      supplier.supplierId = counter.sequence_value;
      next();
    })
    .catch((error) => {
      console.error("Failed to generate supplier ID:", error);
      next(error);
    });
});

// Replace Index with createIndex
supplierSchema.set("autoIndex", false);
supplierSchema.index({ userId: 1 }, { unique: true, sparse: true });
const suppliers = mongoose.model("suppliers", supplierSchema, "suppliers");
router.use(express.json());

router.get("/supplier-available", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

router.get("/", (req, res) => {
  suppliers.find({}, (err, supplierList) => {
    if (err) {
      console.error("Failed to fetch supplier data:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.json(supplierList);
  });
});

// Insert a new supplier
router.post("/", (req, res) => {
  const newSupplier = new suppliers(req.body);
  newSupplier.save((err, supplier) => {
    if (err) {
      console.error("Failed to insert supplier:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.json(supplier);
  });
});

// Update an supplier
router.put("/:supplierId", (req, res) => {
  const supplierID = req.params.supplierId;
  const updatedData = req.body;

  suppliers.findOneAndUpdate({ supplierId: supplierID }, updatedData, { new: true }, (err, updatedAccount) => {
    if (err) {
      console.error("Failed to update supplier:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    if (!updatedAccount) {
      console.log("Supplier not found:", supplierID);
      res.status(404).json({ message: "Supplier not found" });
      return;
    }
    console.log("Supplier updated:", updatedAccount);
    res.json({ message: "Supplier updated successfully", supplier: updatedAccount });
  });
});

// Delete an supplier
router.delete("/:supplierId", (req, res) => {
  const supplierID = req.params.supplierId;

  suppliers.findOneAndDelete({ supplierId: supplierID }, (err, deletedAccount) => {
    if (err) {
      console.error("Failed to supplier:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    if (!deletedAccount) {
      res.status(404).json({ message: "Supplier not found" });
      return;
    }
    res.json({ message: "Supplier deleted successfully", company: deletedAccount });
  });
});

module.exports = router;
