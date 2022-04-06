var db = require('../../config/mongo');
var Schema = db.Schema;

module.exports = db.model('User', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    name:  { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    location: String,
    address: String,
    imei: String,
    role: {type: String, default : 'admin', required: true},
    allow_access: {type: Number, default: 1},
    app_access: {type: Number, default: 0},
    created_at: { type: Date, default: Date.now()}
}));