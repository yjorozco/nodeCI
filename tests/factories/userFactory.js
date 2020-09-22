const User = require('../../models/User')

module.exports = async () => {
  const userNew = new User({});
  const user = await userNew.save();
  return user;
};
