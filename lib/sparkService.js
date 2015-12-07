module.exports = function(token) {
  var sparkFactory = require('csco-spark');
  var spark = sparkFactory({
    uri: 'https://api.ciscospark.com/hydra/api/v1/',
    token: token
  })
  // var spark = require('csco-spark')({
  //   uri: 'https://api.ciscospark.com/hydra/api/v1/',
  //   token: token
  // }),
  var Promise = require('bluebird');

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
    var message = {};
    message.roomId = args.roomId;
    if(args.msg) {
      message.text = args.msg;
    } else {
      message.file = args.file;
    }
    return spark.sendMessage(message).then(function(res) {
      return res;
    })
  };

  sparkService.getPerson = function(personEmail) {
    return spark.getPerson({ email : personEmail }, token);
  };

  sparkService.addMemberToRoom = function(options) {
    /*
      @params
      {
        "roomId": "roomId",
        "personId": "personId" || ""
        "personEmail": "personEmail" || "",
      }
    */
    return spark.addMemberToRoom({
      roomId: options.roomId,
      personEmail: options.personEmail
    });
  };
  //Deprecate
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

  sparkService.removeUserFromRoom = function(id) {
    return spark.removeUserFromRoom(id);
  };

  sparkService.addWebhook = function(params) {
    return spark.addWebhook({
      name: params.name,
      targetUrl: params.target,
      resource: 'messages',
      event: 'created',
      filter: `roomId=${params.roomId}`
    });
  };

  sparkService.getMessage = function(messageId) {
    return spark.getMessage(messageId);
  };

  sparkService.getRoomMessages = function(roomId) {
    return spark.getRoomMessages(roomId);
  };

  return sparkService;
};
