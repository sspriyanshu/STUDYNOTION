const mongoose = require("mongoose");
const { setThePassword } = require("whatwg-url");

const courseProgressSchema = new mongoose.Schema({
    
    courseID:{
        type:String,
        ref:"Course",
    },
    completedVideos:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"SubSection",
        }
    ]
});

module.exports = mongoose.model("CourseProgress", courseProgressSchema); 