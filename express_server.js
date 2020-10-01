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
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID", date: new Date(), visits: 0, visitorIPs: {} },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID", date: new Date(), visits: 0, visitorIPs: {} }
};

const usersDatabase = {
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
}

// GET / POST methods
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.user_id || req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.redirect(403, "/");
    return ;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls/");
});

app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id || req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.redirect(403, "/");
    return ;
  }

  if (!req.body.longURL) {
    res.redirect(400, `/urls/${req.params.shortURL}`);
    return ;
  }

  const longURL = getValidURL(req.body.longURL);
  urlDatabase[req.body.shortURL].longURL = longURL;
  const templateVars = {
    shortURL: req.body.shortURL,
    longURL: urlDatabase[req.body.shortURL].longURL,
    user: usersDatabase[req.session.user_id],
    visits: urlDatabase[req.params.shortURL].visits,
    uniqueVisits: Object.keys(urlDatabase[req.params.shortURL].visitorIPs).length,
    visitRecords: urlDatabase[req.params.shortURL].visitorIPs
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = usersDatabase[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return ;
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]) {
    res.redirect(400, "/urls");
    return ;
  }

  if (!req.session.user_id) {
    res.redirect(403, "/login");
    return ;
  } 
  
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.redirect(403, "/urls");
    return ;
  }

  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: usersDatabase[req.session.user_id],
    visits: urlDatabase[req.params.shortURL].visits,
    uniqueVisits: Object.keys(urlDatabase[req.params.shortURL].visitorIPs).length,
    visitRecords: urlDatabase[req.params.shortURL].visitorIPs
  };
  res.render("urls_show", templateVars);
});


app.get("/urls", (req, res) => {
  const userURLs = urlsForUser(urlDatabase, req.session.user_id);
  const templateVars = { urls: userURLs, user: usersDatabase[req.session.user_id]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect(403, "/login");
    return ;
  }

  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    longURL: getValidURL(req.body.longURL),
    userID: req.session.user_id,
    date: new Date(),
    visits: 0,
    visitorIPs: { }
  };
  res.redirect(`/urls/${newShortURL}`);
})

app.get("/u/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    res.redirect(403, "/login");
    return ;
  }

  if(!urlDatabase[req.params.shortURL]) {
    res.redirect(400, "/");
    return ;
  }

  if (!getVisitorIP(req.connection.remoteAddress, req.params.shortURL, urlDatabase)) {
    const visitID = generateRandomString();
    urlDatabase[req.params.shortURL].visitorIPs[visitID] = { ip: req.connection.remoteAddress, timestamp: new Date() };
  }

  urlDatabase[req.params.shortURL].visits++;
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("urls_login", { user: null });
})

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, usersDatabase);
  console.log(user);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.redirect(403, "/login");
    return ;
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }

  res.render("urls_register", { user: null });
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password || getUserByEmail(usersDatabase, req.body.email)) {
    res.redirect(400, "/register");
    return ;
  }

  const id = generateRandomString();
  usersDatabase[id] = { id, email: req.body.email, password: bcrypt.hashSync(req.body.password, salt) };
  req.session.user_id = id;
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return ;
  }
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});