var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Program', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    mode: { type: Schema.Types.ObjectId, ref: 'Mode' },
    feesgroup: { type: Schema.Types.ObjectId, ref: 'Feesgroup' },
    form: { type: Schema.Types.ObjectId, ref: 'Form' },
    title: { type: String, required: true },
    intake_num: { type: Number, default: 1 },
    sort_num: { type: Number, default: 1 },
    algo_meta: { type: String, required: true },
    status: { type: Number, default: 1 },
    
}));