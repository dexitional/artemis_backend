var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Form', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    apply_mode: { type: Schema.Types.ObjectId, ref: 'ApplyMode' },
    title: { type: String, required: true },
    meta: { type: Object, required: true },
    steps: { type: Number, default: 9 },
    status: { type: Number, default: 1 },
}));
