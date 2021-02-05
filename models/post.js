var mongoose = require('mongoose');
var DateTime = require('luxon');

var Schema = mongoose.Schema;

var PostSchema = new Schema({
    postNumber: { type: Number, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    datePosted: { type: Date, required: true },
    body: { type: String, required: true, maxlength: 240 },
    isDeleted: { type: Boolean, default: false }
})

PostSchema
.virtual('datePostedFormatted')
.get(function() {
    return DateTime.fromJSDate(this.purchase_date).toLocaleString(DateTime.DATE_MED)
})


module.exports = mongoose.model('Post', PostSchema);