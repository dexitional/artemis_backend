export const getTargetGroup = (group_code) => {
    var yr
    switch(group_code){
      case '1000':  yr = `Year 1 Only`; break;
      case '0100':  yr = `Year 2 Only`; break;
      case '0010':  yr = `Year 3 Only`; break;
      case '0001':  yr = `Year 4 Only`; break;
      case '0011':  yr = `Year 1 & Year 2`; break;
      case '1100':  yr = `Year 1 & Year 2`; break;
      case '1010':  yr = `Year 1 & Year 3`; break;
      case '1001':  yr = `Year 1 & Year 4`; break;
      case '1110':  yr = `Year 1,Year 2 & Year 3`; break;
      case '1101':  yr = `Year 1,Year 2 & Year 4`; break;
      case '1111':  yr = `Year 1,Year 2,Year 3 & Year 4`; break;
      case '0000':  yr = `International students`; break;
      default: yr = `International students`; break;
    }
    return yr
}


export const getUsername = (fname,lname) => {
  var username,fr,lr;
  let fs = fname ? fname.trim().split(' '):null
  let ls = lname ? lname.trim().split(' '):null
  if(fs && fs.length > 0){
    for(var i = 0; i < fs.length; i++){
       if(i == 0) fr = fs[i].trim()
    }
  }
  if(ls && ls.length > 0){
     for(var i = 0; i < ls.length; i++){
       if(i == ls.length-1) lr = ls[i].split('-')[0].trim()
     }
   }
   if(!lr && fs.length > 1) lr = fs[1] 
   if(!fr && ls.length > 1){
      fr = fs[1].trim()
      lr = ls[ls.length-1].split('-')[0].trim()
   } 
   return `${fr}.${lr}`.toLowerCase();
}


export const getSemestersByCode = (group_code) => {
  console.log(group_code)
  var yr
  switch(group_code){
    case '1000':  yr = `1,2`; break;
    case '0100':  yr = `3,4`; break;
    case '0010':  yr = `5,6`; break;
    case '0001':  yr = `7,8`; break;
    case '0011':  yr = `5,6,7,8`; break;
    case '0101':  yr = `3,4,7,8`; break;
    case '0110':  yr = `3,4,5,6`; break;
    case '0111':  yr = `3,4,5,6,7,8`; break;
    case '1011':  yr = `1,2,5,6,7,8`; break;
    case '1100':  yr = `1,2,3,4`; break;
    case '1010':  yr = `1,2,5,6`; break;
    case '1001':  yr = `1,2,7,8`; break;
    case '1110':  yr = `1,2,3,4,5,6`; break;
    case '1101':  yr = `1,2,3,4,7,8`; break;
    case '1111':  yr = `1,2,3,4,5,6,7,8`; break;
    case '0000':  yr = `1,2,3,4,5,6,7,8`; break;
  }
  return yr
}