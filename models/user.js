var mongoose = require('mongoose');
var DateTime = require('luxon');

var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: { type: String, lowercase: true, required: true,
        validate: {
            validator: function(value) {
                const User = this;
                return new Promise((resolve, reject) => {
                    User.constructor.findOne({ username: value })
                    .then((userFound) => {
                    if (!userFound) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }).catch(err => resolve(true));
            })},
            message: 'Username is already taken.'
    }},
    password: { type: String, required: true, minlength: 15 },
    member: { type: Boolean, default: false },
    joinDate: { type: Date, required: true },
    postsBy: [{ type: Schema.Types.ObjectId, ref: 'Post'}]
})

UserSchema
.virtual('postCount')
.get(function() { 
    return this.postsBy.length;
})

module.exports = mongoose.model('User', UserSchema);