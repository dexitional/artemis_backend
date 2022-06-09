var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('ApplyClass', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    class: { type: String, required: true },
    value: { type: Number, required: true },
    status: { type: Number, default: 1 },
}));