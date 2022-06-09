var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Choice', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    applicant: { type: Schema.Types.ObjectId, ref: 'Applicant' },
    program: { type: Schema.Types.ObjectId, ref: 'Program' },
    pin: { type: String },
    created_at: { type: Date, default: new Date() },
    updated_at: { type: Date },
    status: { type: Number, default: 0 },
}));

