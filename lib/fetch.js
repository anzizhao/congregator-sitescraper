var async = require('async');
var util = require('util');
var debug = require('debug')('sitescraper:fetch');
var request = require('request');
var userAgents = require('./user-agents')();

//var request = require('superagent');

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
    var fetchUrl = this.imageServer;
    console.log( 'fetchUrl',  fetchUrl)

    async.waterfall([
        function(callback) {
            // 对body 没有处理   交个handler处理
            this.handler(opt, body, callback);

        }.bind(this),
        function(entries, callback) {
            if ( ! fetchUrl ) {
                return callback(null, entries);
            }

            //转化出来的entries 
            //wired 网站做图片缓存处理
            async.map( entries, function(entry, callback){
                switch( entry.site ) {
                    case 'Wired Science': 
                    case 'bole': 
                    case 'segmentfault':
                        break;
                    default: 
                        return callback(null, entry);
                }
                var requestData = {
                    url: entry.image,
                    category:  entry.site.replace(/\s/g, ""),
                    options: {
                        webp: true, 
                    }
                };
                request({
                    url: fetchUrl,
                    method: "POST",
                    json: true,
                    //body: JSON.stringify(requestData)
                    body: requestData
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        entry.imageB = body.data.url
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


