// express 라이브러리 사용
const express = require("express");
const app = express();

// static 파일을 추가하려면 해당 파일이 있는 폴더를 server.js에 등록해야 함
// "/public" 경로에 있는 파일들을 html에서 사용 가능하도록 함
app.use(express.static(__dirname + "/public"));

// MongoDB 연결하는 코드
const { MongoClient } = require("mongodb");

let db;
const url =
  "mongodb+srv://she020108:ebP2mtLOblNyvZni@cluster0.dtbvib6.mongodb.net/?retryWrites=true&w=majority";
new MongoClient(url)
  .connect() // MongoDB에 접속
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum"); // "forum"이라는 이름의 db에 접속
  })
  .catch((err) => {
    console.log(err);
  });

// 내 컴퓨터에서 8080 PORT 오픈
// PORT: 다른 컴퓨터에서 내 컴퓨터에 접속할 수 있는 통로
// "http://IPv4주소:PORT번호"로 내 컴퓨터에 접속 가능
app.listen(8080, () => {
  console.log("http://localhost:8080 에서 서버 실행 중");
});

// path(/)에 접속 시 콜백함수가 실행됨
// 메인페이지(http:/localhost:8080)에 접속 시 index.html 페이지 표시
// __dirname: 현재 파일이 속해있는 폴더의 절대경로
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// "/hello"로 접속 시 db의 "post" collection에 document 1개 추가
app.get("/hello", (req, res) => {
  db.collection("post").insertOne({ date: Date.now() });
  res.send("Hello");
});

app.get("/about", (req, res) => {
  res.sendFile(__dirname + "/about.html");
});

// "post" collection의 데이터를 배열 형식으로 불러옴
app.get("/list", async (req, res) => {
  let result = await db.collection("post").find().toArray();
  console.log(result); // 터미널에 출력됨
  res.send(result.map((item) => item.date));
});
