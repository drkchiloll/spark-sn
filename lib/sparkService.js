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
      console.log(res);
      return res;
    })
  }

  return sparkService;
};
