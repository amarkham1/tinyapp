const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { urlDB, usersDB } = require('./db');
const {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
  getValidURL,
  getVisitorIP,
  deleteURL,
  currentUserEqualsURLUser
} = require('./helpers');

const app = express();
const PORT = 8080;
const salt = bcrypt.genSaltSync(10);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Somewhat long string key'],
}));

// POST methods
app.post("/urls/:shortURL/delete", (req, res) => {
  const sessionID = req.session.userID;
  const shortURL = req.params.shortURL;
  const shortURLExists = urlDB[shortURL];
  
  if (!shortURLExists) {
    res.redirect(400, "/");
  }

  if (!currentUserEqualsURLUser(sessionID, urlDB[shortURL].userID)) {
    res.redirect(403, "/");
    return;
  }

  deleteURL(urlDB, req.params.shortURL);
  res.redirect("/urls/");
});

app.post("/urls/:shortURL", (req, res) => {
  const sessionID = req.session.userID;
  const shortURL = req.params.shortURL;
  const longURL = getValidURL(req.body.longURL);

  if (!currentUserEqualsURLUser(sessionID, urlDB[shortURL].userID)) {
    res.redirect(403, "/");
    return;
  }

  if (!longURL) {
    res.redirect(400, `/urls/${shortURL}`);
    return;
  }

  urlDB[shortURL].longURL = longURL;
  const templateVars = {
    shortURL,
    longURL: longURL,
    user: usersDB[sessionID],
    visits: urlDB[shortURL].visits,
    uniqueVisits: Object.keys(urlDB[shortURL].visitorIPs).length,
    visitRecords: urlDB[shortURL].visitorIPs
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
  const sessionID = req.session.userID;
  const shortURL = req.params.shortURL;

  // takes user to /login if not logged in or their /urls page if they are
  if (!currentUserEqualsURLUser(sessionID, urlDB[shortURL].userID)) {
    res.redirect(403, "/");
    return;
  }

  const templateVars = {
    shortURL,
    longURL: urlDB[shortURL].longURL,
    user: usersDB[sessionID],
    visits: urlDB[shortURL].visits,
    uniqueVisits: Object.keys(urlDB[shortURL].visitorIPs).length,
    visitRecords: urlDB[shortURL].visitorIPs
  };

  res.render("urls_show", templateVars);
});


app.get("/urls", (req, res) => {
  const sessionID = req.session.userID;
  if (!sessionID) {
    res.redirect(400, "/login");
    return;
  }
  const userURLs = urlsForUser(urlDB, sessionID);
  const templateVars = { urls: userURLs, user: usersDB[sessionID]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const sessionID = req.session.userID;

  if (!sessionID) {
    res.redirect(403, "/login");
    return;
  }

  let newShortURL = generateRandomString();
  urlDB[newShortURL] = {
    longURL: getValidURL(req.body.longURL),
    userID: sessionID,
    date: new Date(),
    visits: 0,
    visitorIPs: { }
  };

  res.redirect(`/urls/${newShortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDB[shortURL]) {
    res.redirect(400, "/");
    return;
  }

  const ip = req.connection.remoteAddress;
  if (!getVisitorIP(urlDB, ip, shortURL)) {
    const visitID = generateRandomString();
    urlDB[shortURL].visitorIPs[visitID] = { ip, timestamp: new Date() };
  }

  urlDB[shortURL].visits++;
  const longURL = urlDB[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  }
  res.render("urls_login", { user: null });
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(usersDB, req.body.email);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.redirect(403, "/login");
    return;
  }
  req.session.userID = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session.userID = null;

  // Note: specs say to redirect to /urls which would throw error because they're not logged in. changed to /login instead
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  }

  res.render("urls_register", { user: null });
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if (req.session.userID || !email || !password || getUserByEmail(usersDB, email)) {
    res.redirect(400, "/register");
    return;
  }

  const id = generateRandomString();
  usersDB[id] = { id, email, password: bcrypt.hashSync(password, salt) };
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

module.exports = { salt };