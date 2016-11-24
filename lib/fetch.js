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

var gUrl = 'http://localhost:8111/api/v1/picture/fetch';

function handleList(opt,  body, callback) {
    async.waterfall([
        function(callback) {
            // 对body 没有处理   交个handler处理
            this.handler(opt, body, callback);

        }.bind(this),
        function(entries, callback) {
            //转化出来的entries 
            //wired 网站做图片缓存处理
            async.map( entries, function(entry, callback){
                switch( entry.site ) {
                    case 'Wired Science': 
                        break;
                    default: 
                        return callback(null, entry);
                }
                var requestData = {
                    url: entry.image,
                    category:  entry.site,
                    options: {
                        webp: true, 
                    }
                };
                request({
                    url: gUrl,
                    method: "POST",
                    json: true,
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(requestData)
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        entry.imageB = body.data.url
                        console.dir( entry )
                    }
                    callback(null, entry)
                }); 

            }, function(err, _entries ){
                callback(err, _entries) 
            }) 
        }
    ], function(err, result){
        callback(err, result ) 
    })
}



exports = module.exports = {
    getList: getList,
    handleList: handleList,
}; 


