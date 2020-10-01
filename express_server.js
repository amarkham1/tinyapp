const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString, getUserByEmail, urlsForUser, getValidURL, getVisitorIP } = require('./helpers');

const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Somewhat long string key'],
}));
const salt = bcrypt.genSaltSync(10);

// "databases"
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

// GET / POST methods
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.userID || req.session.userID !== urlDB[req.params.shortURL].userID) {
    res.redirect(403, "/");
    return;
  }

  delete urlDB[req.params.shortURL];
  res.redirect("/urls/");
});

app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.userID || req.session.userID !== urlDB[req.params.shortURL].userID) {
    res.redirect(403, "/");
    return;
  }

  if (!req.body.longURL) {
    res.redirect(400, `/urls/${req.params.shortURL}`);
    return;
  }

  const longURL = getValidURL(req.body.longURL);
  urlDB[req.body.shortURL].longURL = longURL;
  const templateVars = {
    shortURL: req.body.shortURL,
    longURL: urlDB[req.body.shortURL].longURL,
    user: usersDB[req.session.userID],
    visits: urlDB[req.params.shortURL].visits,
    uniqueVisits: Object.keys(urlDB[req.params.shortURL].visitorIPs).length,
    visitRecords: urlDB[req.params.shortURL].visitorIPs
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = usersDB[req.session.userID];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDB[req.params.shortURL]) {
    res.redirect(400, "/urls");
    return;
  }

  if (!req.session.userID) {
    res.redirect(403, "/login");
    return;
  }
  
  if (req.session.userID !== urlDB[req.params.shortURL].userID) {
    res.redirect(403, "/urls");
    return;
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDB[req.params.shortURL].longURL,
    user: usersDB[req.session.userID],
    visits: urlDB[req.params.shortURL].visits,
    uniqueVisits: Object.keys(urlDB[req.params.shortURL].visitorIPs).length,
    visitRecords: urlDB[req.params.shortURL].visitorIPs
  };
  res.render("urls_show", templateVars);
});


app.get("/urls", (req, res) => {
  const userURLs = urlsForUser(urlDB, req.session.userID);
  const templateVars = { urls: userURLs, user: usersDB[req.session.userID]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.userID) {
    res.redirect(403, "/login");
    return;
  }

  let newShortURL = generateRandomString();
  urlDB[newShortURL] = {
    longURL: getValidURL(req.body.longURL),
    userID: req.session.userID,
    date: new Date(),
    visits: 0,
    visitorIPs: { }
  };
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  if (!req.session.userID) {
    res.redirect(403, "/login");
    return;
  }

  if (!urlDB[req.params.shortURL]) {
    res.redirect(400, "/");
    return;
  }

  if (!getVisitorIP(req.connection.remoteAddress, req.params.shortURL, urlDB)) {
    const visitID = generateRandomString();
    urlDB[req.params.shortURL].visitorIPs[visitID] = { ip: req.connection.remoteAddress, timestamp: new Date() };
  }

  urlDB[req.params.shortURL].visits++;
  const longURL = urlDB[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  }
  res.render("urls_login", { user: null });
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, usersDB);
  console.log(user);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.redirect(403, "/login");
    return;
  }
  req.session.userID = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  }

  res.render("urls_register", { user: null });
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password || getUserByEmail(usersDB, req.body.email)) {
    res.redirect(400, "/register");
    return;
  }

  const id = generateRandomString();
  usersDB[id] = { id, email: req.body.email, password: bcrypt.hashSync(req.body.password, salt) };
  req.session.userID = id;
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});