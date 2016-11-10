var async = require('async');
var util = require('util');
var debug = require('debug')('sitescraper:fetch');
var request = require('request');
var userAgents = require('./user-agents')();


function getList(opt, callback) {
    var requestOptions = {
        url: opt.url,
        encoding: null, // return body as a buffer with no encoding
        headers: {
            'user-agent': userAgents[opt.format] || userAgents['desktop']
        },
        pool: this.agent
    };

    request(requestOptions, function (err, response, body) {
        if (err) {
            debug('error when polling opt: ' + opt.url);
            debug(util.inspect(err));
        }
        callback(err, body);
    });
}

function handleList(opt,  body, callback) {
    // 对body 没有处理   交handler处理
    this.handler(opt, body, callback);
}

exports = module.exports = {
    getList: getList,
    handleList: handleList,
}; 


