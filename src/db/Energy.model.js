/**
 * @author Mahmoud Atef
 */

const mongoose = require("mongoose");

const scheme = new mongoose.Schema({
  rank: Number,
  country: String,
  consumed: String,
  worldShare: String,
  perCapita: String,
});

module.exports = EnergyModel = mongoose.model("EnergyModel", scheme);
