// express 라이브러리 사용
const express = require("express");
const app = express();
// MongoDB 연결하는 코드
const { MongoClient, ObjectId } = require("mongodb");

// static 파일을 추가하려면 해당 파일이 있는 폴더를 server.js에 등록해야 함
// "/public" 경로에 있는 파일들을 html에서 사용 가능하도록 함
app.use(express.static(__dirname + "/public"));
// ejs setting
app.set("view engine", "ejs");
// 유저가 보낸 요청을 req.body로 간단히 사용할 수 있도록 세팅
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// "/hello"로 접속 시 db의 "hello" collection에 document 1개 추가
app.get("/hello", (req, res) => {
  db.collection("hello").insertOne({ date: Date.now() });
  res.send("Hello");
});

app.get("/about", (req, res) => {
  res.sendFile(__dirname + "/about.html");
});

// "post" collection의 데이터를 배열 형식으로 불러옴
app.get("/list", async (req, res) => {
  let result = await db.collection("post").find().toArray();
  res.render("list.ejs", { posts: result }); // ejs파일로 데이터 전송
});

// "/time"으로 접속하면 현재 시간 표시
app.get("/time", (req, res) => {
  let now = new Date();
  res.render("time.ejs", { time: now });
});

// 글 작성 페이지
app.get("/write", (req, res) => {
  res.render("write.ejs");
});

// "/newpost"로 온 POST요청 처리
app.post("/newpost", async (req, res) => {
  let userInput = req.body;
  try {
    // 예외처리 (title과 content 모두 공백이 아닌 경우에만 db에 저장)
    if (userInput.title && userInput.content) {
      await db.collection("post").insertOne({
        title: req.body.title,
        content: req.body.content,
      });
      res.redirect("/list"); // 새 글 작성 후 목록 페이지로 이동
    } else {
      // res.send("Title/content required");
      res.redirect("/write");
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(e); // 서버 오류 메시지 (+에러코드 전송)
  }
});

// 상세페이지
// URL파라미터 문법 - "/:변수명"
app.get("/detail/:id", async (req, res) => {
  try {
    // findOne(objectData): objectData를 포함하는 document 1개 불러옴
    let result = await db
      .collection("post")
      .findOne({ _id: new ObjectId(req.params.id) }); // req.params로 URL파라미터 사용
    // id 형식은 맞는데 db에 존재하지 않는 경우 null이 반환됨
    if (!result) {
      res.status(404).send("Invalid URL");
    }
    res.render("detail.ejs", { post: result });
  } catch (e) {
    console.log(e);
    // id가 형식에 맞지 않는 경우 bSON 에러 발생
    res.status(404).send("Invalid URL");
  }
});

// 수정페이지
app.get("/edit/:id", async (req, res) => {
  try {
    // 기존 제목, 내용 불러와서 표시
    let result = await db
      .collection("post")
      .findOne({ _id: new ObjectId(req.params.id) });
    res.render("edit.ejs", { post: result });
  } catch (e) {
    console.log(e);
    res.status(500).send("서버 오류");
  }
});

// 글 수정
app.post("/change/:id", async (req, res) => {
  try {
    let input = req.body;
    if (input.title && input.content) {
      let result = await db
        .collection("post")
        .updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { title: input.title, content: input.content } }
        );
      console.log(result);
      res.redirect("/list");
    } else {
      res.redirect("/change/" + req.params.id);
    }
  } catch (e) {
    console.log(e);
    res.send("수정 실패");
  }
});
