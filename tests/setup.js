jest.setTimeout(999999999);
const mongoose = require('mongoose');
const keys = require('../config/keys');
mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true })