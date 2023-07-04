module.exports =  {

  getGrade : (num,grades) => {
    if(num == null) return 'I'
    num = parseFloat(num)
    console.log(grades)
    const vs = grades && grades.find(row => row.min <= num && num <= row.max)
    return (vs && vs.grade) || 'I';
  },

  getPoint : (num,grades) => {
    num = parseFloat(num)
    const vs = grades && grades.find(row => row.min <= num && num <= row.max)
    return (vs && parseFloat(vs.gradepoint)) || 0;
  },

  isTrailed : (num,trail) => {
    if(num == null) return false
    num = parseFloat(num)
    trail = parseFloat(trail)
    return num <= trail;
  },

  /*
  average : (indexno,session_id,results) => {
    // credit, gradepoint, session_id 
    let pa = { gpa:0, cgpa:0 }
    if(results.length > 0){
       // GPA
       const gp_sum = results.filter(r => r.session_id == session_id).reduce(((acc,r) => {
           const gp = this.helperData.getPoint(r.total_score,r.grade_meta) * r.credit
           return gp+acc;
       }, 0))
       const gp_credit = results.filter(r => r.session_id == session_id).reduce(((acc,r) => r.credit+acc,0))
       pa.gpa = gp_sum/gp_credit  
      
       // CGPA
       const cp_sum = results.filter(r => r.session_id <= session_id).reduce(((acc,r) => {
           const gp = this.helperData.getPoint(r.total_score) * r.credit
           return gp+acc;
       }, 0))
       const cp_credit = results.filter(r => r.session_id <= session_id).reduce(((acc,r) => r.credit+acc,0))
       pa.cgpa = cp_sum/cp_credit
      
    } 
    */
}
