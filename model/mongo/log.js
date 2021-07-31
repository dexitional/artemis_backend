var db = require('../config/database');
var Schema = db.Schema;

module.exports = db.model('Log', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    action:  { type: String, required: true },
    meta: { type: String, required: true },
    created_at: { type: Date, default: Date.now()}
}));