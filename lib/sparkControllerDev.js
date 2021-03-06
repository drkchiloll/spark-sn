var Promise = require('bluebird'),
    utils = require('./utilities'),
    path = require('path'),
    fs = require('fs');

var dbFactory = require('./db'),
    db = dbFactory('pocSparksDev.db');

var sendMsg = (serv, params) => {
  var message = {};
  message.roomId = params.roomId;
  if(params.msg) {
    message.msg = params.msg;
  } else {
    message.file = params.file;
  }
  return serv.sendMessage(message);
};

var getPerson = (serv, member) => {
  return serv.getPerson(member);
};

var addToRoom = (serv, params) => {
  return serv.addUserToRoom({
    roomId: params.roomId,
    userIds: params.userIds
  });
};

var addMemToRoom = (serv, params) => {
  return serv.addMemberToRoom({
    roomId: params.roomId,
    personEmail: params.personEmail
  });
};

var removeMemFromRoom = (serv, memberId) => {
  return serv.removeUserFromRoom(memberId);
};

module.exports = function(sparkService) {
  var sparkCntrler = {};

  sparkCntrler.pocStarter = function(req, res) {
    var poc = req.body;
    var pocStarter = utils.parseReqBody(poc);
    var msg = utils.composeMessage(pocStarter);
    var members, memberDetails = {};
    var roomId;
    sparkService.createRoom(pocStarter.pocName).then(function(id) {
      // Get the RoomId and Set The Response
      if(id) {
        roomId = id;
        members = pocStarter.pocMembers;
        //Send Response w/RoomID to Service Now immediately
        res.status(201).send({ id : roomId });
        //Add Members in WatchList to the Room
        return Promise.map(members, function(member) {
          // var modMember = member.replace('dev.', '');
          return addMemToRoom(sparkService, {
            roomId: roomId,
            personEmail: member
          }).then(function(memberData) {
            // modMember = member.replace('dev.', '');
            var modMember = member.replace(/\./gi, '\uff0E');
            memberDetails[modMember] = memberData.id;
            return;
          })
        }).then(function() {
          //Send Project Message into the Newly Created Room
          return sendMsg(sparkService, {
            roomId: roomId,
            msg: msg
          })
        })
        .then(function() {
          //Add Outbound Webhooks to the Room
          return sparkService.addWebhook({
            name: pocStarter.atcReq,
            target: 'https://sparkint.proxy.wwtatc.com/pochooksDev',
            roomId: roomId
          }).then(function(hook) {
            //Add Record to DB
            db.insert({
              _id: roomId,
              atcRequest: pocStarter.atcReq,
              room: pocStarter.pocName,
	            webHookId: hook.id,
              status: pocStarter.status,
              projectMgr: pocStarter.projectMgr,
              projectNumber: pocStarter.projectNumber,
              members: memberDetails
            });
          });
        })
      } else {
        res.status(401).send({ message : 'Authentication Error' });
      }
    })
  };

  sparkCntrler.pocUpdate = function(req, res) {
    var roomId = req.params.id;
    var pocUpdater = utils.parseReqBody(req.body);
    var members = pocUpdater.pocMembers;
    var currentMembers, docMembers;
    var dbRecord;
    //Query DB for Members of this POC
    return db.findPoc(roomId).then(function(doc) {
      if(doc) {
        dbRecord = doc;
        currentMembers = Object.keys(doc.members);
        docMembers = doc.members;
        return Promise.filter(members, function(member) {
          // Are there Any Members just Received From SN not in the DB?
          // var convertMember = member.replace('dev.', '');
          var convertMember = member.replace(/\./gi, '\uff0E');
          return currentMembers.indexOf(convertMember) < 0;
        }).each(function(noDbMem) {
          // noDbMem = noDbMem.replace('dev.', '');
          return addMemToRoom(sparkService, {
            roomId: roomId,
            personEmail: noDbMem
          }).then(function(memberData) {
            if(memberData.hasOwnProperty('errors')) {
              return;
            } else {
              docMembers[noDbMem.replace(/\./gi, '\uff0E')] = memberData.id;
              return db.updMembers({
                id: roomId,
                members: docMembers
              });
            }
          });
        })
        .then(function() {
          return Promise.filter(currentMembers, function(currentMember) {
            var userEmail = currentMember.replace(/\uff0E/gi, '.');
            return members.indexOf(userEmail) < 0;
          }).each(function(noServNowMem) {
            var memberId = doc.members[noServNowMem];
            delete docMembers[noServNowMem];
            return removeMemFromRoom(sparkService, memberId).then(function() {
              return db.updMembers({
                id: roomId,
                members: docMembers
              });
            });
          })
        })
      }
    })
    .then(function() {
      //Does a New Message Need to be Composed?
      var status, pm, projectNumber;
      if(dbRecord.status !== pocUpdater.status) {
        status = pocUpdater.status;
      }
      if(pocUpdater.projectMgr) {
        if(dbRecord.projectMgr !== pocUpdater.projectMgr) {
          pm = pocUpdater.projectMgr;
        }
      }
      if(pocUpdater.projectNumber) {
        if(dbRecord.projectNumber !== pocUpdater.projectNumber) {
          projectNumber = pocUpdater.projectNumber;
        }
      }
      if(status || pm || projectNumber) {
        var newMsg = utils.composeUpdateMessage({
          status: status || '',
          pm: pm || '',
          projectNumber: projectNumber || ''
        });
        sendMsg(sparkService, {
          roomId: roomId, msg: newMsg
        }).then(function() {
          db.updRecords({
            id: roomId,
            status: status || '',
            projectMgr: pm || '',
            projectNumber: projectNumber || ''
          });
        });
      }
      return res.status(204).send({});
    });
  };

  sparkCntrler.queryPoc = function(req, res) {
    //Search DB by ATCRequest
    var atcReq = req.params.atc;
    db.findPoc(atcReq).then(function(doc) {
      res.status(200).json(doc);
    });
  };

  sparkCntrler.queryMember = function(req, res) {
    db.findMembers({
      id: req.params.atc,
      member: req.body.personEmail
    }).then(function(doc) {
      res.send(doc);
    })
  };

  sparkCntrler.popMember = function(req, res) {
    var atcReq = req.params.atc;
    db.rmLastMember(atcReq).then(function() {
      res.status(204);
    })
  };

  sparkCntrler.addNewMember = function(req, res) {
    db.addNewMember({
      id: req.params.atc,
      member: {
        personEmail: req.body.email,
        memberId: req.body.memberId
      }
    })
    res.status(201).send({});
  };

  sparkCntrler.removeMember = function(req, res) {
    db.removeMember({
      id: req.params.atc,
      member: {
        personEmail: req.body.email,
        memberId: req.body.memberId
      }
    });
  };

  sparkCntrler.removeRecord = (req, res) => {
    var atcReq = req.params.atc;
    db.deleteRecord(atcReq).then(function(removed) {
      res.status(204).send({});
    });
  };

  sparkCntrler.handleHooks = function(req, res) {
    var reqData = req.body;
    var msg, roomId, htmlFile, txtFile;
    if(reqData.message) {
      msg = (reqData.message).toLowerCase();
      roomId = reqData.roomId;
      if(msg.includes('archive')) {
        return sparkService.getRoomMessages(roomId).then(function(data) {
          var messages = JSON.parse(data).items;
          var msgArchive = utils.constructText(messages);
          // console.log(utils.constructHtml(messages));
          txtFile = 'archive_' + new Date().getTime() + '.txt';
          var txtFilePath = path.join(__dirname,'../public/files/'+ txtFile);
          fs.writeFileSync(txtFilePath, msgArchive, 'utf8');
          // Upload Static File into the Room
          return sparkService.sendMessage({
            roomId: payload.roomId,
            file: 'https://sparkint.proxy.wwtatc.com/fileupload/' + txtFile
          }).then(function(data) {
            res.status(204).send({});
          })
        })
      }
    } else {
      //Whenever WebHook is created Programmatically this is the path
      var msgId = reqData.data.id;
      sparkService.getMessage(msgId).then(function(data) {
        var payload = JSON.parse(data);
        msg = (payload.text).toLowerCase();
        if(msg) {
          roomId = payload.roomId;
          if(msg.includes('archive')) {
            //Get All Messages from the Room
            return sparkService.getRoomMessages(roomId).then(function(data) {
              var messages = JSON.parse(data).items;
              var msgArchive = utils.constructText(messages);
              // console.log(utils.constructHtml(messages));
              return db.findPoc(roomId).then(function(doc) {
                txtFile = doc.atcRequest;
                txtFile += '_' + new Date().getTime() + '.txt';
        	      var txtFilePath = path.join(__dirname,'../public/files/'+ txtFile);
        	      fs.writeFileSync(txtFilePath, msgArchive, 'utf8');
                // Upload Static File into the Room
                return sparkService.sendMessage({
                  roomId: payload.roomId,
                  file: 'https://sparkint.proxy.wwtatc.com/fileupload/' + txtFile
                }).then(function(data) {
                  res.status(204).send({});
                })
              })
            })
          } else if(msg.includes('destroy the room')) {
            return db.findPoc(roomId).then(function(doc) {
              //Need these to also remove cleanly
              var webHookId = doc.webHookId;
              return Promise.all([
                sparkService.removeWebHook(webHookId),
                sparkService.removeRoom(roomId),
                db.deleteRecord(roomId)
              ])
            })
            .then(function() {
              res.status(204).send({});
            })
          }
        }
      });
    }
  };

  return sparkCntrler;
};
