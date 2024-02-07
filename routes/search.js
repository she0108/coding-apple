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

// 검색기능
router.get("/", async (req, res) => {
  let query = req.query.q;
  let page = req.query.p;
  if (page == 0) {
    return res.redirect(`/search?q=${query}&p=1`);
  }
  // let postNum = await db
  //   .collection("post")
  //   .find({ title: { $regex: `.*${query}.*` } })
  //   .count();
  // let posts = await db
  //   .collection("post")
  //   .find({ title: { $regex: `.*${query}.*` } })
  //   .skip((page - 1) * 6)
  //   .limit(6)
  //   .toArray();
  let countFilter = [
    {
      $search: {
        index: "title_index",
        text: { query: query, path: "title" },
      },
    },
    { $count: "count" },
  ];
  let postFilter = [
    {
      $search: {
        index: "title_index",
        text: { query: query, path: "title" },
      },
    },
    { $skip: (page - 1) * 6 },
    { $limit: 6 },
  ];
  let postNum = await db.collection("post").aggregate(countFilter).toArray();

  let posts = await db.collection("post").aggregate(postFilter).toArray();
  if (postNum > 1 && posts.length == 0) {
    return res.redirect(`/search?q=${query}&p=${page - 1}`);
  }
  res.render("search.ejs", {
    postNum: postNum.length > 0 ? postNum[0]["count"] : 0,
    page: page,
    posts: posts,
    query: query,
  });
});

module.exports = router;
