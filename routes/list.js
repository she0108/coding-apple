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

// 글목록페이지
router.get("/", async (req, res) => {
  let page = req.query.p;
  if (page == 0) {
    return res.redirect("/list?p=1"); // 이전페이지 존재하지 않는 경우
  }
  let posts = await db
    .collection("post")
    .find()
    .skip((page - 1) * 6) // 앞에 n개 건너뛰고
    .limit(6) // n개 불러오기
    .toArray();
  let postNum = await db.collection("post").countDocuments();
  if (posts.length == 0) {
    return res.redirect(`/list?p=${page - 1}`); // 다음페이지 존재하지 않는 경우
  }
  res.render("list.ejs", {
    postNum: postNum,
    page: page,
    posts: posts,
  }); // ejs파일로 데이터 전송
});

module.exports = router;
