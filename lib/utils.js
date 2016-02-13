var Promise = require('bluebird'),
    moment = require('moment'),
    cheerio = require('cheerio'),
    path = require('path'),
    pdf = require('html5-to-pdf'),
    fs = require('fs');

module.exports = (() => {
  // Helpers of Helpers :-)
  var getUser = (user) => {
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

  var txtMsg = (msges) => {
    var dateForm = 'l LT';
    return msges.reduce((str, msg) => {
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

  var helpers = {};

  helpers.composeMessage = (payload) => {
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

  helpers.composeUpdateMessage = (params) => {
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

  helpers.constructText = (messages) => {
    //* 5/1/2015 8:30 PM
    dateFormat = 'l LT';
    // Remove the First Message (archive messages) from the List
    messages.shift();
    return txtMsg(messages);
  };

  helpers.memsAndMsgesText = (stuff) => {
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

  // Make Directory where Files will be Offloaded
  helpers.mkdir = (dirName) => {
    return new Promise((resolve, reject) => {
      fs.mkdir(dirName, (err) => {
        resolve(true);
      });
    });
  };

  // Set Encoding when Saving Files to Disk
  var fileEnc = (fn) => {
    switch(path.extname(fn)) {
      case '.png':
      case '.jpg':
      case '.zip':
      case '.docx':
      case '.pptx':
      case '.xlsx':
      case '.pdf':
      case '.vsd':
        return 'base64';
      default:
        return null;
    }
  };

  helpers.writeFile = (dir, file) => {
    var fn = file.fileName,
        fileContents = file.blob;
    return new Promise((resolve, reject) => {
      fs.writeFile(`${dir}/${fn}`, fileContents, fileEnc(fn), (err) => {
        resolve(true);
      });
    });
  };

  helpers.zipExpire = (filePath) => {
    // Remove ZIP file after app. 45min
    setTimeout(() => {
      fs.unlink(filePath, (err) => true);
    }, 2700000);
  };

  helpers.handleEmails = members =>
    members
      //Some Don't have this Property
      .filter(member => member.personEmail)
      // Return List of Emails
      .map(member => member.personEmail);

  helpers.contactHtmlPanel = (rmTitle, contacts) => {
    var tempHtml = path.join(__dirname, '../public');
    var $ = cheerio.load(fs.readFileSync(`${tempHtml}/index.html`));
    $('h3#title').text(rmTitle);
    var tdata = $('tbody#tblbody');
    contacts.forEach(contact => {
      tdata.append(`<tr><td>${contact}</td></tr>`);
    });
    return $.html(); //HTML as a String
  };

  helpers.msgHtmlPanel = (html, msges) => {
    var dtFormat = 'l LT',
        $ = cheerio.load(html),
        msgBody = $('div#msgbody');
    msges.forEach(msg => {
      if(msg.text) {
        msgDt = new Date(msg.created);
        msgBody.append(
          `<p><strong>${msg.personEmail}</strong> ${moment(msgDt).format(dtFormat)}`+
          `<p>${(msg.text).includes('\n') ? msg.text.replace(/\n/gi, '<br/>') : msg.text}<p>`+
          `<hr>`
        );
      }
    });
    return $.html();
  };

  helpers.htmlToPdf = (fn, html) => {
    var cssPath =
      path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.css');
    var filePath = path.join(__dirname, '../public/files');
    return new Promise((resolve, reject) => {
      pdf({
        cssPath: cssPath
      }).from.string(params.html).to(`${filePath}/${params.fn}.pdf`, () => {
        resolve('finished');
      })
    });
  };

  return helpers;
})();
