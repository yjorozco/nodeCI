const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

/*const client = redis.createClient(14740,
    'redis-14740.c241.us-east-1-4.ec2.cloud.redislabs.com', {
    no_ready_check: true,
    auth_pass: '123456.#'
});*/

const client = redis.createClient(keys.redisUrl);

client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}){
    this.useCache = true;
    this.hasKey = JSON.stringify(options.key || ''); 
    return this;
}


mongoose.Query.prototype.exec = async function () {
    if(!this.useCache){
        return exec.apply(this,arguments);
    }
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));

    const cacheValue = await client.hget(this.hasKey, key);

    if (cacheValue) {
        const doc = JSON.parse(cacheValue);
        return Array.isArray(doc)
            ? doc.map(d =>  new this.model(d))
            : new this.model(doc);
    }
    const result = await exec.apply(this, arguments);


    client.hset(this.hasKey, key, JSON.stringify(result), 'EX', 10);

    return result;


}

module.exports = {
    clearHash(haskey){
        client.del(JSON.stringify(haskey));
    }
}

