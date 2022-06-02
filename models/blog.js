const mongoose = require("mongoose");


const BlogSchema =  new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    
},
content: {
    type: String,
    required: true,
    
},
order:Number,
userinfo:String

});
BlogSchema.virtual("blogId").get(function () { //프론트엔드
  return this._id.toHexString();
});
BlogSchema.set("toJSON", {
  virtuals: true,
});
module.exports = mongoose.model(`Blog`, BlogSchema);