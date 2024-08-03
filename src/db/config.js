/**
 * DataBase conncetion
 * @desc create connector that have connect function and connection
 * @author Mahmoud Atef
 */

const mongoose = require("mongoose");
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;

const connect = async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(DB_CONNECTION_STRING, {
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("connected to db successful.");
  } catch (err) {
    console.log("error on db connection", err);
    throw err;
  }
};

const disconnect = async () => await mongoose.disconnect();

module.exports = connector = {
  connect,
  disconnect,
  connection: mongoose.connection,
};
