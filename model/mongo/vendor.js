var db = require('../../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Vendor', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    tech_name: { type: String },
    tech_phone: { type: String },
    tech_email: { type: String },
    api_token: { type: String },
    verified: { type: Boolean, default: false },
    verified_at: { type: Date },
    status: { type: Number, default: 0 },
}));