var db = require('../../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Voucher', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    session: { type: Schema.Types.ObjectId, ref: 'Session' },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    serial: { type: String, required: true, unique: true },
    pin: { type: String, required: true, unique: true},
    applicant_name: { type: String },
    applicant_phone: { type: String },
    applicant_email: { type: String },
    sold_at: { type: Date },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date },
    status: { type: Number, default: 0 },
}));