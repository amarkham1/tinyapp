function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

const getUserByEmail = (userDB, email) => {
  for (const user in userDB) {
    if (userDB[user].email === email) {
      return userDB[user];
    }
  }
}

const urlsForUser = (urlDB, userID) => {
  let result = {};
  for (const [record, data] of Object.entries(urlDB)) {
    if (data.userID === userID) {
      result[record] = data;
    }
  }
  return result;
}

module.exports = { generateRandomString, getUserByEmail, urlsForUser };