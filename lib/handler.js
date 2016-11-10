var cheerio = require('cheerio');
var async = require('async');
var util = require('util');
var url = require('url');
var helpers = require('./helpers');

var debug = require('debug')('sitescraper:handler');

var request = require('request');
var userAgents = require('./user-agents')();

var fs = require('fs');

var uuid = require('uuid');

var saveDir= '/var/leechImage/'; 
var urlDir= '/images/'

function saveImageToDir(res, body,callback) {
    // 保存图片  返回新的图片地址 
    var id = uuid.v1(); 
    var savePath = saveDir +  id;
    fs.writeFile(savePath, body, function(err){
        //debug('success to save image: ' + (urlDir + id));
        callback(null, urlDir + id );
    })
    //var w = fs.createWriteStream(savePath);
    //res.pipe(w)
    //w.on('finish', function(){
        //callback(null, urlDir + uuid );
    //});
}



function fetchImage (url, callback) {
    var opt = {
        url: url,
        encoding: null, // return body as a buffer with no encoding
        headers: {
            'user-agent': userAgents['desktop']
        },
        pool: this.agent
    };

    request(opt, function (err, response, body) {
        if (err) {
            debug('error when polling opt: ' + opt.url);
        }
        callback(err, response, body);
    });
}


function fetchImageToLocal(images, callback) {
    var mv = this
    async.map(images, function(image, callback){
        if( ! image.image )  {
            callback(null, image); 
        }
        async.waterfall([
            fetchImage.bind(mv, image.image),
            saveImageToDir,
        ], function(err, url ){
            if( ! err ) {
                image.image = url
            } 
            callback(err, image) 
        }) 
    }, function(err, fetchedImages ){
        callback( err, fetchedImages ); 
    })
}



exports = module.exports = function () {
    return function (site, body,  callback) {
        var $ = cheerio.load(body);
        var resultList = [];
        var ranking = 1;

        // THIS IS SYNCRONOUS
        site.template.containers.forEach(function (container) {
            // loop through all the container types that can hold articles
            $(container.selector).each(function () {
                // flag for valid entry
                var valid = true;
                // article-entry
                var entry = {
                    site: site.name,
                    source: site.url,
                    host: url.parse(site.url).host,
                    origin: site.origin,
                    category: site.category || []
                };

                // this is where we fetch all the data
                container.elements.forEach(function (element) {
                    var holder; // hold the result

                    // if the element is required for entry to be valid, then set validity to false
                    if (element.required) {
                        valid = false;
                    }

                    // loop through all the items
                    element.items.forEach(function (item) {
                        // use selector to find DOM element
                        $(item.selector, this).each(function () {
                            // find attribute (use element text if no attribute is provided)
                            if (item.attribute && $(this).attr(item.attribute)) {
                                holder = $(this).attr(item.attribute).trim();
                            }
                            else {
                                holder = $(this).text().trim();
                            }

                            // delimit the text if required
                            if (holder && item.delimiter) {
                                var tempHolder = holder.toString();
                                holder = tempHolder.slice(0, tempHolder.indexOf(item.delimiter)).trim();
                            }

                            // set item if it has been found
                            if (holder && !entry[element.name]) {
                                entry[element.name] = holder;
                            }
                        });
                    }.bind(this));

                    // add fallback if supplied
                    if (element.fallback && !entry[element.name]) {
                        entry[element.name] = element.fallback;
                    }

                    if (entry[element.name] && (element.type == 'url')) {
                        entry[element.name] = helpers.fixRelativePath(entry[element.name], entry.source);
                    }

                    // check if item is required for entry to be valid, and then check if item is set
                    if (element.required && entry[element.name]) {
                        valid = true;
                    }

                }.bind(this));


                // push entry to array (if a link is found in the article)
                if (valid) {
                    entry.ranking = ranking++;
                    resultList.push(entry);
                }
            });
        });
        
        if( site.name === 'bole' ) {
            // 对于伯乐网站需要获取所有的图片
            (fetchImageToLocal.bind(this))(resultList, callback );
        } else {
            callback(null, resultList);
        } 
    };
};
