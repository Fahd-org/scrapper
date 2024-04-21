/** @module HomeModel
 * @author Mahmoud Atef
 */

const mongoose = require("mongoose");

const homeModuleScheme = new mongoose.Schema({
  value: Number,
  rel: String,
  growthRate: Number,
  timestamp: Number,
});

homeModuleScheme.query.byRel = function (rel) {
  return this.where({ rel: rel });
};

module.exports = HomeModule = mongoose.model("HomeModule", homeModuleScheme);
