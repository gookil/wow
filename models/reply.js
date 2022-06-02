const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
    postId: Number,
    commentsId: {
        type: Number,
        unique: true,
    },
    nickname: String,
    comment: String,
   
});

ReplySchema.virtual("replyId").get(function () { //프론트엔드
    return this._id.toHexString();
  });
  ReplySchema.set("toJSON", {
    virtuals: true,
  });

module.exports = mongoose.model('Reply', ReplySchema);