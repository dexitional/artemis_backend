var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Feeitem', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    fees: { type: Schema.Types.ObjectId, ref: 'Fees' },
    session: { type: Schema.Types.ObjectId, ref: 'Session' },
    mode: { type: Schema.Types.ObjectId, ref: 'Mode' },
    narrative: { type: String },
    amount: { type: Number },
    created_at: { type: Date },
    status: { type: Number, default: 0 },
}));

