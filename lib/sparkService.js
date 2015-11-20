var spark = require('csco-spark'),
    Promise = require('bluebird');

module.exports = function(token) {
  var sparkService = {};

  sparkService.createRoom = function(roomName) {
    return spark.createRoom({
      title: roomName
    }, token).then(function(res) {
      if(res) {
        return res.id;
      } else {
        console.log(res);
      }
    })
  };

  sparkService.sendMessage = function(args) {
    return spark.sendMessage({
      roomId: args.roomId,
      text: args.msg
    }, token).then(function(res) {
      // console.log(res);
      return res;
    })
  };

  sparkService.getPerson = function(personEmail) {
    // console.log(personEmail);
    return spark.getPerson({ email : personEmail }, token);
  };

  sparkService.addUserToRoom = function(args) {
    var userIds = args.userIds;
    var participants = userIds.reduce(function(arr, userId) {
      arr.push({id: userId, isModerator: false});
      return arr;
    }, []);

    return spark.addUserToRoom({
      roomId: args.roomId,
      participants: { participants: participants }
    }, token);
  };

  return sparkService;
};
