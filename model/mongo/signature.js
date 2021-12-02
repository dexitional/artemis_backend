var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Signature', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    title: { type: String, required: true },
    dump: { type: String },
    created_at: { type: Date, default: Date.now()},
    updated_at: { type: Date},
    status: { type: Number, default: 1 },
}));

