var Promise = require('bluebird'),
    utils = require('./utilities');

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
    var roomId;
    sparkService.createRoom(pocStarter.pocName).then(function(id) {
      // Get the RoomId and Set The Response
      if(id) {
        roomId = id;
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
