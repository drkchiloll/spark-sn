var path = require('path'),
    Promise = require('bluebird'),
    DataStore = require('nedb');

module.exports = function(dbName) {
  var db = new DataStore({
    filename: path.join(__dirname, '../.data/'+dbName),
    autoload: true
  });

  var dbService = {};

  dbService.insert = function(record) {
    return new Promise(function(resolve, reject) {
      db.insert(record, function(err, data) {
        if(err) return resolve({error: err});
        else resolve(data);
      });
    });
  };

  dbService.findPoc = function(qs) {
    var query = {};
    if(qs.startsWith('ATC')) {
      query.atcRequest = qs;
    } else {
      query._id = qs;
    }
    return new Promise(function(resolve, reject) {
      db.find(query, function(err, doc) {
        resolve(doc[0]);
      });
    });
  };

  /*
    @params: id = Spark RoomID
    @params: member
    PersonEmail Address cannot contain . so we use Unicode for . \uff0E
      {
        "personEmail":"memberId"
      }
  */
  dbService.updMembers = function(params) {
    db.update({_id: params.id}, {
      $set: {members: params.members}
    }, {});
  };

  dbService.deleteRecord = function(qs) {
    var query = {};
    if(qs.startsWith('ATC')) {
      query.atcRequest = qs;
    } else {
      query._id = qs;
    }
    return new Promise(function(resolve, reject) {
      db.remove(query, function(err, numRemoved) {
        resolve(numRemoved);
      });
    });
  };

  return dbService;
};
