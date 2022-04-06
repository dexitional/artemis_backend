var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Session', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    title: { type: String, required: true },
    apply_start: { type: Date, required: true},
    apply_end: { type: Date, required: true},
    status: { type: Number, default: 0 },
}));