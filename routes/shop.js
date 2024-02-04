const router = require("express").Router();
const connectDB = require("../database");

let db;
connectDB
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum"); // "forum"이라는 이름의 db에 접속
  })
  .catch((err) => {
    console.log(err);
  });

router.get("/shirts", (req, res) => {
  res.send("셔츠 판매");
});

router.get("/pants", (req, res) => {
  res.send("바지 판매");
});

module.exports = router;
