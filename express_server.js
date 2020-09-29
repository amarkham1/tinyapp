const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

const getUser = email => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
}

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls/");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.body.shortURL] = req.body.longURL;
  const templateVars = { shortURL: req.body.shortURL, longURL: urlDatabase[req.body.shortURL]};
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"] ]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});


app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  res.render("urls_login", templateVars);
})

app.post("/login", (req, res) => {
  const user = getUser(req.body.email);
  if (!user || user.password !== req.body.password) {
    res.redirect(403, "/login");
    return ;
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.redirect(400, "/register");
    return ;
  }

  if (getUser(req.body.email)) {
    res.redirect(400, "/register");
    return ;
  }
  const id = generateRandomString();
  users[id] = { 
    id,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});