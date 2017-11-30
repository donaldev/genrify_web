const assert = require("assert");
const User = require("../models/user");

describe("Creating a new user", () => {
  it("should save a new user to our db", (done) => {
    const newUser = new User({
      name: "Jane",
      spotifyId: "JK32U81NDSJ",
      email: "janedoe@gmail.com"
    });
    newUser.save()
           .then(()=>{
             assert(!newUser.isNew);
             done();
           });
  });

  it("should not save a user without an email", (done) => {
    const userNoEmail = new User({
      name: "Jane",
      spotifyId: "KJJDSDJSHD"
    });

    userNoEmail.save()
                .then(Promise.resolve())
                .catch((error)=>{
                  assert.equal(error.errors.email.message, "Email required.");
                  done();
                });
  })

  it("should not save user without ID", (done) => {
    const invalidUser = new User({
      name: "John",
      email: "johndoe@gmail.com"
    });

    invalidUser.save()
                .then(Promise.resolve())
                .catch((error)=>{
                  assert.equal(error.errors.spotifyId.message, "ID is required.");
                  done();
                });
  });
});
