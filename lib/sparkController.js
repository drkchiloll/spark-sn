var Promise = require('bluebird');

module.exports = function(sparkService) {
  var sparkCntrler = {};

  sparkCntrler.pocStarter = function(req, res) {
    var poc = req.body;
    var pocStarter = {
      pocName: 'POC ' + poc.sfOpportunity + ' - ' + poc.requestNumber,
      projectNumber: poc.projectNumber || 'PENDING Assignment',
      am: getUser(poc.accountManager),
      cse: getUser(poc.cse),
      projectMgr: getUser(poc.projectManager),
      atcReq: poc.requestNumber,
      salesForceLink: poc.sfIrLink,
      status: poc.status || 'NEW',
      opportunity: poc.sfOpportunity,
      watchList: poc.watchList,
      description: poc.description
    };
    var msg = composeMessage(pocStarter);
    var roomId;
    sparkService.createRoom(pocStarter.pocName).then(function(id) {
      // Get the RoomId and Set The Response
      if(id) {
        roomId = id;
        sparkService.sendMessage({
          roomId: roomId,
          msg: msg
        }).then(function() {
          //Get POC Members IDs
          var members = pocStarter.watchList;
          var personIds = [];
          return Promise.each(members, function(member) {
            return sparkService.getPerson(member).then(function(person) {
              var personId = person.items[0].id;
              personIds.push(personId);
              return;
            });
          }).then(function() {
            return sparkService.addUserToRoom({
              roomId: roomId,
              userIds: personIds
            });
          })
          .then(function() {
            res.status(201).send({ id : id });
          })
        })
      } else {
        res.status(500).send({ message : 'Server Error' });
      }
    })
  };

  sparkCntrler.pocUpdate = function(req, res) {
    var roomId = req.params.id;
    console.log(roomId);
    res.status(204).send({});
  };

  return sparkCntrler;
};

function getUser(user) {
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
}

function composeMessage(payload) {
  return (`POC Name: ${payload.pocName}
ATC Req No: ${payload.atcReq}
Opportunity: ${payload.opportunity}
SF Link: ${payload.salesForceLink}
Project Number: ${payload.projectNumber}
AM: ${payload.am}
CSE: ${payload.cse}
PM: ${payload.projectMgr}
Status: ${payload.status}

${payload.description}`);
}
