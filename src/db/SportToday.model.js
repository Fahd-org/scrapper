/**
 * @author Mahmoud Atef
 */

const mongoose = require("mongoose");

const scheme = new mongoose.Schema({
  week: String,
  time: String,
  status: String,
  teams: {
    a: { name: String, image: String },
    b: { name: String, image: String },
  },
  score: {
    a: String,
    b: String,
  },
  timestamp: Number,
});

module.exports = SportToday = mongoose.model("SportToday", scheme);
