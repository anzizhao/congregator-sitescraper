var read = require('node-read');
var async = require('async');
var debug = require('debug')('sitescraper:content-fetcher');



function getContent(opt, item, callback) {
    var url = item[opt.linkref];
    callback(null, url);
}

exports = module.exports =  {
    getContent: getContent
};

