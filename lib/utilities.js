exports.parseReqBody = function(poc) {
  // var pocMainMems = [
  //   poc.accountManager || '',
  //   poc.cse || '',
  //   poc.projectManager || '',
  // ];
  // var pocMembers = poc.watchList.concat(pocMainMems);
  var pocMembers = poc.watchList;
  return {
    pocName: 'POC ' + poc.sfOpportunity + ' - ' + poc.requestNumber,
    projectNumber: poc.projectNumber || 'PENDING Assignment',
    am: getUser(poc.accountManager),
    cse: getUser(poc.cse),
    projectMgr: getUser(poc.projectManager),
    atcReq: poc.requestNumber,
    salesForceLink: poc.sfIrLink,
    status: poc.status || 'NEW',
    opportunity: poc.sfOpportunity,
    pocMembers: pocMembers,
    description: poc.description
  };
};

var getUser = function(user) {
  if(user) {
    var f = user.split('@')[0].split('.')[0];
    var firstName = f.slice(0,1).toUpperCase() + f.slice(1);
    var l = user.split('@')[0].split('.')[1];
    var lastName = l.slice(0,1).toUpperCase() + l.slice(1);
    var u = firstName + ' ' + lastName;
    return u;
  } else {
    return 'PENDING Assignment';
  }
};

exports.composeMessage = function(payload) {
  return (`${payload.pocName}
 ATC Req No: ${payload.atcReq}
 Opportunity: ${payload.opportunity}
 SF Link: ${payload.salesForceLink}
 Project Number: ${payload.projectNumber}
 AM: ${payload.am}
 CSE: ${payload.cse}
 PM: ${payload.projectMgr}
 Status: ${payload.status}

 ${payload.description}`);
};
