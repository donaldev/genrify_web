const mongoose = require("mongoose");
const Schema = mongoose.Schema; //allows us to create Schema for our users

const UserSchema = new Schema({
    name: {
      type: String
    },
    spotifyId: {
      type: String,
      required: [true, "ID is required."],
      unique: true
    },
    email: {
      type: String,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please use a valid email address'],
      unique: true,
      required: [true, "Email is required."]
    }, //every Schema should have a property with name of type String
    country: String,
    tracks: [{
      name: String,
      id: String,
      artist_name: String,
      artist_id: String
    }],
    genres: [String],
    artists: [{
      name: String,
      id: String,
      genres: [String]
    }],
    top_genres: [String],
    likes: [String],
    playlist: [{
      image: String,
      name: String,
      id: String,
    }],
    cities: [{
      name: String,
      id: String
    }]
});

const User = mongoose.model("user", UserSchema);//creates a collection named User and makes it follow the UserSchema

module.exports = User;
