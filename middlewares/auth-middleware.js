const jwt = require('jsonwebtoken');
const User = require('../models/user')

module.exports = (req, res, next) =>{
    const {authorization} = req.headers;
    console.log(req.headers)
    const[tokenType, tokenValue] = authorization.split(' '); //공백으로 배열로 반환 bearer가 토큰 타입 [0], [1]이 내가 가입한 토큰임 스플릿으로 배열화해서 구조할당한거임 이해 됐음?
    
    if(tokenType !== 'Bearer'){
        res.status(401).send({
            errormessage: '로그인하세요',

        });
        return;
    }

    try{ 
        const {userId} = jwt.verify(tokenValue, "my-key");
        console.log(userId)
        console.log(jwt.verify(tokenValue, "my-key"))
        User.findById(userId).exec().then((user)=>{
            res.locals.user = user;
            next();
        });
        

    }catch(error){
        res.status(401).send({
            errormessage: '로그인하세요',
        

        });
        return;
    }
    

    next();
};