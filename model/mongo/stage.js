var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Stage', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    mode: { type: Schema.Types.ObjectId, ref: 'Mode' },
    form: { type: Schema.Types.ObjectId, ref: 'Form' },
    title: { type: String, required: true },
    status: { type: Number, default: 1 },
}));