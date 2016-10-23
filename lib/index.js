var http = require('http');
var Base = require('congregator-base');

var fetch = require('./fetch');
var content = require('./content');

function Scraper (options) {
    Base.call(this, options)
    this.fetcher.setFetchMsg('beginning fetch from scraper: ');
    this.fetcher.setGetListFn( fetch.getList.bind(this) );
    this.fetcher.setHandleListFn( fetch.handleList.bind(this) );
    this.contenter.setGetContentFn( content.getContent.bind(this));

}

function f(){}
f.prototype = Base.prototype;

Scraper.prototype = new f();
Scraper.prototype.handler = require('./handler')();

exports = module.exports = Scraper;
