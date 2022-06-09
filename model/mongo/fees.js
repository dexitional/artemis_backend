var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Fees', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    session: { type: Schema.Types.ObjectId, ref: 'Session' },
    mode: { type: Schema.Types.ObjectId, ref: 'Mode' },
    title: { type: String },
    amount: { type: Number },
    created_at: { type: Date },
    status: { type: Number, default: 0 },
}));

