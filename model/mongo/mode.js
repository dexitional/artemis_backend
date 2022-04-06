var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Mode', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    title: { type: String, required: true },
    status: { type: Number, default: 0 },
}));