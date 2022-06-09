var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('ApplyGrade', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    grade: { type: String, required: true },
    value: { type: Number, required: true },
    status: { type: Number, default: 1 },
})); 