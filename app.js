const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const User = require("./models/user");
const Blog = require("./models/blog")
const authmiddleware = require("./middlewares/auth-middleware")
const Joi = require("joi");
const Reply = require("./models/reply");



mongoose.connect("mongodb+srv://test1:sparta@cluster0.vw1dr.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();
app.use(express.json());


const postUsersSchema = Joi.object({

    nickname: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    email: Joi.string().email(),
    password: Joi.string().min(4).required(),
    confirmPassword: Joi.string().min(4).required()

});


router.post("/users", async (req, res)=>{
    try {
        const {nickname, email, password, confirmPassword } = await postUsersSchema.validateAsync(req.body);
    
    if(password !== confirmPassword){
        res.status(400).send({
            errorMessage: '패스워드가 다릅니다.'
        });
        return; // 리턴을 하지 않으면 패스워드가 다르더라도 밑에 코드들이 실행 되기 때문에 리턴을 하면 여기서 종료됨.
    }

    const existUsers = await User.find({
        $or: [{email}, {nickname}],

    });
    if( existUsers.length){
        res.status(400).send({
            errorMessage: '이미 가입된 이메일 또는 닉네임이 있습니다.'
        });
        return;
    }
    if( password.search(nickname)>-1){ //값이 없음을 의미한다. pas안에서 nick네임을 찾아봐라 값이 있으면 
        res.status(400).send({
            errorMessage:"닉네임은 비밀번호에 포함될 수 없습니다."
        })
         return;

    }

        const user = new User({email, nickname, password});
        await user.save();

        res.status(201).send({});
        
    } catch (error) {
        res.status(400).send({
            errorMessage:"올바른 형식이 아닙니다."
            
        });
       
    }
    
    
})


const postAuthSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  router.post("/auth", async (req, res) => {
    try {
      const { email, password } = await postAuthSchema.validateAsync(req.body);
      console.log(email, password)
      const user = await User.findOne({ email, password }).exec();
      console.log("user",user)
  
      if (!user) {
        console.log("user", user)
        
        res.status(400).send({
          errorMessage: "이메일 또는 패스워드가 잘못됐습니다.",
        });
        return;
      }
  
      const token = jwt.sign({ userId: user.userId }, "my-key");
      res.send({
        users:token,
      });
    } catch (err) {
        console.log(err);
      res.status(400).send({
        errorMessage: "요청한 데이터 형식이 올바르지 않습니다.",
      });
    }
  });


router.get("/users/me", authmiddleware, async (req, res) =>{
    const { user } = res.locals;
    console.log(res.locals);
    res.send ({
      user,
    });
  });
  


router.get("/blog", async (req, res)=>{
  const blogs = await Blog.find().sort("-order").exec()

  res.send({blogs});
});



router.post("/blog",  async (req, res)=>{
  

  const { title, content  } = req.body; //구조분해 할당 //value(객체)의 보냄 req.body로 보냄(요청이라 생각하지말고 보낸다는 개념으로 생각하자)
  const maxOrderblog = await Blog.findOne().sort("-order").exec();//오더를 기준으로 내림차순, Todo에서 찾는다.(스키마에서 모델화 시킨js파일)을 정렬하고 exec(실행시킴)
  let order = 1;//exec 매써드 정규표현식과 일치하는 문자열들을 배열에 담아서 리턴
  
  if(maxOrderblog) {
      order = maxOrderblog.order +1;
  }
  const blogs = new Blog ({ title, content, order }); //Todo 객체로 선언 앞에는 변수 선언
  await blogs.save(); //저장

  res.send({ blogs});
})



router.delete("/blog/:blog", async (req, res) => {
  const { blogId } = req.params; // 값을 파라미터로 받아와서 모르면 console 찍고 res로 받아온뒤 f12로 확인
  console.log(blogId)

  const blog = await Blog.findById(blogId).exec(); //blogid에서 찾는다 하나
  await blog.delete();//삭제

  res.send({});
});


router.get("/blog", async (req, res)=>{
  const blogs = await Blog.find().sort("-order").exec()

  res.send({blogs});
});


router.get('/replys', async (req, res)=> {
  const replys = await Reply.find().sort("-commentsId").exec();

  res.send ({ replys })
});


router.post('/replys',  async (req, res) => {
  
  const { comment } = req.body;
  const maxcommentsId = await Reply.findOne().sort('-commentsId').exec(); //가장 높은 값을 가져옴
        let commentsId = 1;
      
        if (maxcommentsId) {
            commentsId = maxcommentsId.commentsId + 1;
        } 

        const reply = new Reply({comment, commentsId});
        await reply.save();
        res.send({ reply });
});

router.put('/replys', async (req, res) => {
  const { nickname } = res.locals.user;
  const { postId, commentsID, comment } = req.body;

  const comments = await Reply.findOne({ commentsId: Number(commentsID) });

  if (!comments) {
      return res.status(400).json({ success: false, ereorMessage: '존재 하지 않는 댓글' });
  } else if (comments['nickname'] !== nickname) {
      return res.status(400).send({ ereorMessage: '사용자가 쓴 댓글이 아닙니다.' });
  }
  await Reply.updateOne({ commentsId: Number(commentsID) }, { $set: { comment } });
  res.json({ success: true });
});


router.delete("/replys/:replysId", async (req, res)=>{
  const { replysId } = req.params;

  const comment = await Reply.findById(replysId).exec();
  await comment.delete().exec();

  res.send({})
})






app.use("/api", express.urlencoded({ extended: false }), router);


app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});
