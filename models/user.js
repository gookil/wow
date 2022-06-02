const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  nickname: {type: String, 
            required: true, 
            unique: true},
  password: String,

});
UserSchema.virtual("userId").get(function () { //프론트엔드
  return this._id.toHexString();
});
UserSchema.set("toJSON", {
  virtuals: true,
});
module.exports = mongoose.model(`User`, UserSchema);