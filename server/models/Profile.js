const mongoose = require("mongoose");
const { setThePassword } = require("whatwg-url");

const profileSchema = new mongoose.Schema({
    
    gender:{
        type:String,
        default:null,
    },
    dateOfBirth:{
        type:String,
    },
    about:{
        type:String,
        trim:true,
    },
    contactNumber:{
        type:Number,
        trim:true,
    },
});

module.exports = mongoose.model("Profile", profileSchema); 