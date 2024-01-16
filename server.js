// express 라이브러리 사용
const express = require("express");
const app = express();

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

// "http:/localhost:8080/hello" 에 접속 시 "Hello" 표시
app.get("/hello", (req, res) => {
  res.send("Hello");
});

app.get("/about", (req, res) => {
  res.sendFile(__dirname + "/about.html");
});
