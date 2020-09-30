const { assert } = require('chai');

const { getUserByEmail, urlsForUser, getValidURL } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testURLs = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID", visits: 0, visitorIPs: [] },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID", visits: 0, visitorIPs: [] },
  "aaadad": { longURL: "http://www.test.com", userID: "user2RandomID", visits: 0, visitorIPs: [] },
  "bcbccc": { longURL: "http://www.example.com", userID: "userRandomID", visits: 0, visitorIPs: [] }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.equal(user.id, expectedOutput);
  });

  it('should return undefined with email not in database', function() {
    const user = getUserByEmail("fake@example.com", testUsers);
    const expectedOutput = undefined
    assert.strictEqual(user, expectedOutput);
  });
});

describe('urlsForUser', function() {
  it('should return an object with all of a users urls', function() {
    const urls = urlsForUser(testURLs, "userRandomID");
    const expectedOutput = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID", visits: 0, visitorIPs: [] },
      "bcbccc": { longURL: "http://www.example.com", userID: "userRandomID", visits: 0, visitorIPs: [] }
    };
    assert.deepEqual(urls, expectedOutput);
  });

  it('should return an empty object with user with no urls', function() {
    const urls = urlsForUser(testURLs, "user3RandomID");
    const expectedOutput = {};
    assert.deepEqual(urls, expectedOutput);
  });
});

describe('getValidURL', function() {
  it('should add http:// when provided url doesnt have one', function() {
    assert.strictEqual(getValidURL('www.test.com'),'http://www.test.com');
  });

  it('should remove white space', function() {
    assert.strictEqual(getValidURL('  http  :  /  / www.test.com '),'http://www.test.com');
  });
});