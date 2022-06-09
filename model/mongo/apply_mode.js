var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('ApplyMode', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    title: { type: String, required: true },
    description: { type: String },
    status: { type: Number, default: 1 },
}));