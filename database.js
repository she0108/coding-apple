const { MongoClient } = require("mongodb");

// MongoDB에 접속
const url = process.env.MONGO_DB_URL;
let connectDB = new MongoClient(url).connect();

module.exports = connectDB;
