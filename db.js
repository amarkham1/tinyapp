const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

const urlDB = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID", date: new Date(), visits: 0, visitorIPs: {} },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID", date: new Date(), visits: 0, visitorIPs: {} }
};

const usersDB = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey", salt)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", salt)
  }
};

module.exports = { urlDB, usersDB };