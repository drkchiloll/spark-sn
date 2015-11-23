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

  dbService.updMembers = function(params) {
      db.update({_id: params.id}, {
        $push: { members: params.member}
      }, {})
  };

  dbService.rmLastMember = function(atcReq) {
    return new Promise(function(resolve, reject) {
      db.update({atcRequest: atcReq}, {
        $pop: {members: 1}
      }, {});
    });
  };

  dbService.deleteRecord = function(atcReq) {
    return new Promise(function(resolve, reject) {
      db.remove({atcRequest: atcReq}, {multi: true}, function(err, numRemoved) {
        resolve(numRemoved);
      });
    });
  };

  return dbService;
};
