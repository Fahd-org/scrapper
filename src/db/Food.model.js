/**
 * @author Mahmoud Atef
 */

const mongoose = require("mongoose");

const scheme = new mongoose.Schema({
  rank: Number,
  country: String,
  value: String,
  precentage: String,
  pop: String,
});

module.exports = FoodModel = mongoose.model("FoodModel", scheme);
