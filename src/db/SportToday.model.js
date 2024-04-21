/**
 * @author Mahmoud Atef
 */

const mongoose = require("mongoose");

const scheme = new mongoose.Schema({
  teams: [{ name: String, img: String }],
  info: { line1: String, line2: String },
  timestamp: Number,
});

module.exports = SportToday = mongoose.model("SportToday", scheme);
