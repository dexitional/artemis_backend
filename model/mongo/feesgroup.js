var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Feesgroup', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    fees: { type: Schema.Types.ObjectId, ref: 'Fees' },
    mode: { type: Schema.Types.ObjectId, ref: 'Mode' },
    created_at: { type: Date },
    status: { type: Number, default: 0 },
}));