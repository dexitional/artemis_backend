var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Letter', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    program: { type: Schema.Types.ObjectId, ref: 'Program' },
    session: { type: Schema.Types.ObjectId, ref: 'Session' },
    signature: { type: Schema.Types.ObjectId, ref: 'Signature' },
    letter_date: { type: Date },
    header_html: { type: String },
    content_html: { type: String },
    footer_html: { type: String },
    status: { type: Number, default: 1 },
}));
