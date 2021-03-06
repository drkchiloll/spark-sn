var moment = require('moment');


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
  return (
    `${payload.pocName}\n`+
    `ATC Req No: ${payload.atcReq}\n`+
    `Opportunity: ${payload.opportunity}\n`+
    `SF Link: ${payload.salesForceLink}\n`+
    `Project Number: ${payload.projectNumber}\n`+
    `AM: ${payload.am}\n`+
    `CSE: ${payload.cse}\n`+
    `PM: ${payload.projectMgr}\n`+
    `Status: ${payload.status}\n\n`+
    `${payload.description}`
  );
};

exports.composeUpdateMessage = (params) => {
  var msg = `PROJECT UPDATE:\n`;
  if(params.status) {
    msg += `STATUS: ${params.status}\n`;
  }
  if(params.pm) {
    msg += `PM Assigned: ${params.pm}\n`;
  }
  if(params.projectNumber) {
    msg += `Project Number: ${params.projectNumber}\n`;
  }
  return msg;
};

var txtMsg = (msges) => {
  dateFormat = 'l LT';
  return msges.reduce(function(str, msg) {
    if(msg && msg.text) {
      if(msg.text !== 'archive messages' && msg.text !== '/archive') {
        var msgCreated = new Date(msg.created);
        str +=
          `${msg.personEmail} ${moment(msgCreated).format(dateFormat)}\n` +
          `${msg.text}\n\n`;
      } else {
        str += ``;
      }
    } else {
      str += ``;
    }
    return str;
  }, ``);
};

exports.constructText = function(messages) {
  //* 5/1/2015 8:30 PM
  dateFormat = 'l LT';
  // Remove the First Message (archive messages) from the List
  messages.shift();
  return txtMsg(messages);
};

exports.memsAndMsgesText = (stuff) => {
  var roomName = stuff.roomName;
  var strng = `${roomName} Members:\n`;
  strng = stuff.members.reduce((s, member) => {
    s+=`${member}\n`;
    return s;
  }, strng);
  strng += `\nRoom Messages:\n`;
  strng += txtMsg(stuff.messages);
  return strng;
};

exports.constructHtml = function(messages) {
  return messages.reduce(function(str, message) {
    var textMessages = message.text;
    textMessages = textMessages.replace(/\r/gi, '');
    textMessages = textMessages.split('\n');
    var text = textMessages.reduce(function(txtStr, textMsg) {
      txtStr += `<p style='margin:5px 0 5px 0'>${textMsg}</p>`+'\n';
      return txtStr;
    }, '');
    str += `<h4>${message.personEmail}</h4>`+'\n'+ text;
    return str;
  }, '');
};
