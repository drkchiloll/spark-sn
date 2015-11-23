var Promise = require('bluebird'),
    utils = require('./utilities');

var dbFactory = require('./db'),
    db = dbFactory('pocSparks.db');

var sendMsg = (serv, params) => {
  return serv.sendMessage({
    roomId: params.roomId,
    msg: params.msg
  });
}

var getPerson = (serv, member) => {
  return serv.getPerson(member);
}

var addToRoom = (serv, params) => {
  return serv.addUserToRoom({
    roomId: params.roomId,
    userIds: params.userIds
  });
}

module.exports = function(sparkService) {
  var sparkCntrler = {};

  sparkCntrler.pocStarter = function(req, res) {
    var poc = req.body;
    var pocStarter = utils.parseReqBody(poc);
    var msg = utils.composeMessage(pocStarter);
    var members;
    var roomId;
    sparkService.createRoom(pocStarter.pocName).then(function(id) {
      // Get the RoomId and Set The Response
      if(id) {
        roomId = id;
        members = pocStarter.pocMembers;
        //Add Record to DB
        db.insert({
          _id: roomId,
          atcRequest: pocStarter.atcReq,
          room: pocStarter.pocName,
          members: members,
        });
        //Send Response w/RoomID to Service Now immediately
        res.status(201).send({ id : id });
        // Continuing AFTER RESP Sent
        sendMsg(sparkService, {
          roomId: roomId, msg: msg
        }).then(function() {
          var members = pocStarter.pocMembers;
          var personIds = [];
          return Promise.each(members, function(member) {
            return getPerson(sparkService, member).then(function(person) {
              var personId = person.items[0].id;
              personIds.push(personId);
              return;
            });
          }).then(function() {
            return addToRoom(sparkService, {
              roomId: roomId, userIds: personIds
            });
          })
        });
      } else {
        res.status(401).send({ message : 'Authentication Error' });
      }
    })
  };

  sparkCntrler.pocUpdate = function(req, res) {
    var roomId = req.params.id;
    var pocUpdater = utils.parseReqBody(req.body);
    //Query DB for Members of this POC
    var members = pocUpdater.pocMembers;
    var currentMembers;
    var newMembers = [];
    return db.findPoc(roomId).then(function(doc) {
      if(doc) {
        currentMembers = doc.members;
        return Promise.filter(members, function(member) {
          return currentMembers.indexOf(member);
        }).each(function(noDbMem) {
          newMembers.push(noDbMem);
          db.updMembers({
            id: roomId, member: noDbMem
          });
          return;
        });
      }
    })
    .then(function() {
      var newMsg = utils.composeMessage(pocUpdater);
      sendMsg(sparkService, {
        roomId: roomId, msg: newMsg
      }).then(function() {
        if(newMembers.length > 0) {
          var personIds = [];
          return Promise.each(newMembers, function(member) {
            return getPerson(sparkService, member).then(function(person) {
              var personId;
              if(member === 'samuel.womack1@gmail.com') {
                personId = 'Y2lzY29zcGFyazovL3VzL1BFT1BMRS9lN2IzNjZjYy1jM2I5LTQ4NGEtYjVhNy0xNDEyMjIxN2JiNDQ';
              } else {
                personId = person.items[0].id;
              }
              personIds.push(personId);
              return;
            });
          }).then(function() {
            return addToRoom(sparkService, {
              roomId: roomId, userIds: personIds
            });
          }).then(function() {
            res.status(204).send({});
          })
        }
      });
    })
  };

  sparkCntrler.queryPoc = function(req, res) {
    //Search DB by ATCRequest
    var atcReq = req.params.atc;
    db.findPoc(atcReq).then(function(doc) {
      res.status(200).json(doc);
    });
  };

  sparkCntrler.popMember = function(req, res) {
    var atcReq = req.params.atc;
    db.rmLastMember(atcReq).then(function() {
      res.status(204);
    })
  };

  sparkCntrler.removeRecord = (req, res) => {
    var atcReq = req.params.atc;
    db.deleteRecord(atcReq).then(function(removed) {
      res.status(204).send({});
    });
  };

  return sparkCntrler;
};
