// express 라이브러리 사용
const express = require("express");
const app = express();
// MongoDB 연결하는 코드
const { MongoClient, ObjectId } = require("mongodb");
// method override 라이브러리 사용
const methodOverride = require("method-override");
const bcrypt = require("bcrypt");
require("dotenv").config();

// static 파일을 추가하려면 해당 파일이 있는 폴더를 server.js에 등록해야 함
// "/public" 경로에 있는 파일들을 html에서 사용 가능하도록 함
app.use(express.static(__dirname + "/public"));
// ejs setting
app.set("view engine", "ejs");
// 유저가 보낸 요청을 req.body로 간단히 사용할 수 있도록 세팅
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// method override 라이브러리 사용
app.use(methodOverride("_method"));

// passport 라이브러리 세팅
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const MongoStore = require("connect-mongo");

app.use(passport.initialize());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }, // 세션 유지 시간
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_DB_URL,
      dbName: "forum",
    }),
  })
);
app.use(passport.session());

let db;
const url = process.env.MONGO_DB_URL;
new MongoClient(url)
  .connect() // MongoDB에 접속
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum"); // "forum"이라는 이름의 db에 접속
  })
  .catch((err) => {
    console.log(err);
  });

// "/list"로 시작하는 API 요청 시 현재 시간을 터미널에 출력
app.use("/list", (req, res, next) => {
  console.log(new Date());
  next();
});

// 로그인 기능
passport.use(
  new LocalStrategy(async (username, password, cb) => {
    // 입력받은 아이디, 비밀번호 검사
    // passport.authenticate("local")()로 실행
    let result = await db.collection("user").findOne({ username: username });
    if (!result) {
      return cb(null, false, { message: "아이디 DB에 없음" });
    }
    if (await bcrypt.compare(password, result.password)) {
      return cb(null, result);
    } else {
      return cb(null, false, { message: "비밀번호 불일치" });
    }
  })
);

// req.logIn() 실행 시 자동으로 실행
passport.serializeUser((user, done) => {
  console.log(user);
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});

// 유저가 보낸 쿠키 분석
passport.deserializeUser(async (user, done) => {
  let result = await db
    .collection("user")
    .findOne({ _id: new ObjectId(user.id) });
  delete result.password;
  process.nextTick(() => {
    done(null, result); // DB 조회해서 최신 유저 정보를 req.user에 넣어줌
  });
});

// 내 컴퓨터에서 8080 PORT 오픈
// PORT: 다른 컴퓨터에서 내 컴퓨터에 접속할 수 있는 통로
// "http://IPv4주소:PORT번호"로 내 컴퓨터에 접속 가능
app.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT} 에서 서버 실행 중`);
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
  if (!req.user) res.redirect("/login");
  else res.render("write.ejs");
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
      res.redirect("/list/1"); // 새 글 작성 후 목록 페이지로 이동
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
app.put("/edit", async (req, res) => {
  try {
    let input = req.body;
    // 제목 또는 내용이 공백인 경우 예외처리
    if (!input.title || !input.content) {
      console.log("빈 제목 또는 빈 내용");
      return res.redirect("/edit/" + input.id);
    }
    // 조건 만족하는 document 1개 찾아서 수정
    let result = await db.collection("post").updateOne(
      { _id: new ObjectId(input.id) }, // 검색 조건
      { $set: { title: input.title, content: input.content } } // 수정사항
    );
    console.log(result);
    if (result.matchedCount == 0) {
      console.log("존재하지 않는 id");
      res.status(404).send("존재하지 않는 글입니다.");
    } else if (result.matchedCount == 1 && result.modifiedCount == 0) {
      console.log("변경사항 없음");
      res.redirect("/edit/" + input.id);
    } else {
      console.log("수정 완료");
      res.redirect("/edit/" + input.id);
    }
  } catch (e) {
    console.log(e);
    res.send("수정 실패");
  }
});

// 글 삭제 기능
app.delete("/post", async (req, res) => {
  try {
    let result = await db
      .collection("post")
      .deleteOne({ _id: new ObjectId(req.query.postid) });
    console.log(result);
    res.send("삭제 완료");
  } catch (e) {
    console.log(e);
    res.send("삭제 실패");
  }
});

// 목록페이지 pagination
app.get("/list/:index", async (req, res) => {
  let index = req.params.index;
  if (index == 0) {
    return res.redirect("/list/1"); // 이전페이지 존재하지 않는 경우
  }
  let posts = await db
    .collection("post")
    .find()
    .skip((index - 1) * 6) // 앞에 n개 건너뛰고
    .limit(6) // n개 불러오기
    .toArray();
  let postNum = await db.collection("post").countDocuments();
  if (posts.length == 0) {
    return res.redirect("/list/" + (index - 1)); // 다음페이지 존재하지 않는 경우
  }
  res.render("list.ejs", {
    postNum: postNum,
    index: index,
    posts: posts,
  }); // ejs파일로 데이터 전송
});

// 마지막 게시글 id 받아서 쿼리하는 게 skip보다 빠름
// app.get("/list/next/:id", async (req, res) => {
//   let result = await db.collection("post")
//     .find({ _id: { $gt: new ObjectId(req.params.id) } })
//     .limit(5).toArray();
//   res.render("list.ejs", { posts: result });
// })

// 회원가입 페이지
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

// 회원가입 기능
app.post("/register", async (req, res) => {
  if (!req.body.username || !req.body.password || !req.body.check) {
    res.send("아이디와 비밀번호를 모두 입력해주세요.");
  } else if (req.body.password != req.body.check) {
    res.send("비밀번호를 다시 한번 확인해주세요.");
  } else {
    let duplicate = await db
      .collection("user")
      .findOne({ username: req.body.username });
    if (duplicate) {
      res.send("사용 중인 아이디입니다.");
    } else {
      await db.collection("user").insertOne({
        username: req.body.username,
        password: await bcrypt.hash(req.body.password, 10),
      });
      res.redirect("/");
    }
  }
});

// 로그인 페이지
app.get("/login", (req, res) => {
  console.log(req.user);
  res.render("login.ejs");
});

// 로그인 기능
app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  })(req, res, next);
});

// 마이페이지
app.get("/mypage", (req, res) => {
  if (!req.user) {
    res.redirect("/login");
  } else {
    res.render("mypage.ejs", { username: req.user.username });
  }
});
