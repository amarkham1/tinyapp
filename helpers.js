function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

const getUserByEmail = (userDB, email) => {
  for (const user in userDB) {
    if (userDB[user].email === email) {
      return userDB[user];
    }
  }
};

const getVisitorIP = (urlDB, ip, shortURL) => {
  for (const [id, record] of Object.entries(urlDB[shortURL].visitorIPs)) {
    if (ip === record.ip) {
      return id;
    }
  }
};

const urlsForUser = (urlDB, userID) => {
  let result = {};
  for (const [record, data] of Object.entries(urlDB)) {
    if (data.userID === userID) {
      result[record] = data;
    }
  }
  return result;
};

const getValidURL = url => {
  let newUrl = url.trim().replace(/\s/g, "");

  if (/^(:\/\/)/.test(newUrl)) {
    return `http${newUrl}`;
  }
  if (!/^(f|ht)tps?:\/\//i.test(newUrl)) {
    return `http://${newUrl}`;
  }

  return newUrl;
};

const getUserIDOfURL = (urlDB, shortURL) => urlDB[shortURL].userID;

const deleteURL = (urlDB, shortURL) => {
  delete urlDB[shortURL];
};

const currentUserEqualsURLUser = (currentUser, urlUser) => currentUser && currentUser === urlUser;

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
  getValidURL,
  getVisitorIP,
  getUserIDOfURL,
  deleteURL,
  currentUserEqualsURLUser
};