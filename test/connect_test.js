const mongoose = require("mongoose");
mongoose.Promise = global.Promise; //ES6 implementation of Promise

//connects to db
before((done) => {
  mongoose.connect("mongodb://127.0.0.1:27017/genrify"); //initiate connection
  mongoose.connection
          .once("open", () => {done();})
          .on("error", (err) => {console.log("Warning", err);});
});
