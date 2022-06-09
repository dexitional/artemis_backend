var db = require('../config/mongo');
var Schema = db.Schema;

module.exports = db.model('Applicant', Schema({
    _id: { type: Schema.Types.ObjectId, auto: true},
    voucher: { type: Schema.Types.ObjectId, ref: 'Voucher' },
    stage: { type: Schema.Types.ObjectId, ref: 'Stage' },
    form: { type: Schema.Types.ObjectId, ref: 'Form' },
    applicant_no: { type: Number, default: 0 },
    meta: { type: Object },
    current_step: { type: Number, default: 9 },
    complete_steps: { type: Number, default: 9 },
    flag_submit: { type: Number, default: 0 },
    flag_admit: { type: Boolean, default: false },
    flag_close: { type: Boolean, default: false },
    grade_value: { type: Number, default: 0 },
    class_value: { type: Number, default: 0 },
    status: { type: Number, default: 1 },
}));

/*
applicant_meta : {
   profile: '',
   guardian: '',
   education: [],
   referee: [],
   result: [],
   employment : [],
   qualification : [],
   document:[],
   choice: [],
   step: 0
}

form_meta : {
   steps: 9,
   fields: {
       '1': { field:'profile', type:'string' }
       '2': { field:'guardian', type:'string' }
       '3': { field:'education', type:'array' }
       '4': { field:'referee', type:'array' }
       '5': { field:'employment', type:'array' }
       '6': { field:'qualification', type:'array' }
       '7': { field:'document', type:'array' }
       '8': { field:'choice', type:'array' }
       '9': { field:'review' type:'string' }
   },

}
*/  