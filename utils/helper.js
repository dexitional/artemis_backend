  const getGrade = (num,grades) => {
    if(num == null) return 'I'
    num = parseFloat(num)
    const vs = grades && grades.find(row => row.min <= num && num <= row.max)
    return (vs && vs.grade) || 'I';
  }

  // const getGrade = (num,grades) => {
  //   console.log("FIGURE: ", num)
  //   if(!num) return 'I'
  //   //num = parseFloat(num)
    
  //   const vs = grades && grades.find(row => {
  //     console.log("MIN: ",row.min, "MAX: ",row.max)
  //     return (Number.parseFloat(row.min) <= Number.parseFloat(num) && Number.parseFloat(num) <= Number.parseFloat(row.max))
  //   })
    
  //   console.log(num, vs)
  //   return (vs && vs.grade) || 'I';
  // }

  const getPoint = (num,grades) => {
    num = parseFloat(num)
    const vs = grades && grades.find(row => row.min <= num && num <= row.max)
    return (vs && parseFloat(vs.gradepoint)) || 0;
  }

  const isTrailed = (num,trail) => {
    if(num == null) return false
    num = parseFloat(num)
    trail = parseFloat(trail)
    return num <= trail;
  }

  const getFgpa = (data) => {
   
      let dt = [], cgp = 0, ccr = 0, ccs = 0, fgpa = 0;
      const semesters = data && Object.entries(data).length || 0;
      data && Object.entries(data).map(([name,rows],i) => {
          if(rows && rows.length > 0){
              let cct = 0, cgt = 0;
              rows.map((row,i) => {
                  cgp += getPoint(row.total_score,JSON.parse(row.grade_meta)) * row.credit
                  ccr += row.credit
                  
                  cgt += getPoint(row.total_score,JSON.parse(row.grade_meta)) * row.credit
                  cct += row.credit
              }) 
              
              // FGPA Algorithm
              if(i%semesters == 1 || i%semesters == 3) fgpa += (1/6*(cgp/ccr))
              if(i%semesters == 5 || i%semesters == 7) fgpa += (2/6*(cgp/ccr))
              
              // CGPA & GPA Algorithm
              dt.push({ cgpa: (cgp/ccr).toFixed(2), gpa:(cgt/cct).toFixed(2), ccp:ccs, cct:ccr  })
        }
      }) 
      
      // setFgpa(semesters > 2 ? fgpa: vdata[vdata.length-1]?.cgpa)
      fgpa = semesters > 2 ? fgpa: dt[dt?.length-1]?.cgpa
      console.log(fgpa)
      return fgpa;
  }

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
  module.exports =  { getGrade,getPoint,isTrailed,getFgpa }
