const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//Method for updating a profile

exports.updateProfile = async (req, res) => {
    try{
        //get data 
        const {dateOfBirth="", about="", contactNumber, gender} = req.body;

        //get userId
        const id = req.user.id;

        //validation
        // if(!contactNumber || !gender || !id){
        //     return res.status(400).json({
        //         success:false,
        //         message:'All fields are required',
        //     })
        // }

        //find profile
        const userDetails = await User.findById(id);

        if (!userDetails) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        const profileId = userDetails.additionalDetails;
        // update profile directly
        const updatedProfile = await Profile.findByIdAndUpdate(
            profileId,
            { dateOfBirth, about, gender, contactNumber },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile: updatedProfile,
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            error:error.message,
        });
    }
};

//deleteAccount

exports.deleteAccount = async (req, res) => {
    try{
        //TODO: Find more on job schedule
        //const job = schedule.scheduleJob("10 * * * * *", function(){
        // console.log("The answer to life, the universe, and everything!")});
        //console.log(job);

        //get id
        const id = req.user.id;

        //validation 
        const user = await User.findById({_id: id});
        if(!user){
            return res.status(404).json({
                success:false,
                message:'User not found',
            });
        }

        //Delete associated profile with the user
        await Profile.findByIdAndDelete({_id:user.additionalDetails});

        //TODO: HW unenroll user from all enrolled courses
        await Course.updateMany(
            { studentsEnrolled: id },
            { $pull: { studentsEnrolled: id } }
        );
        
        //delete user
        await User.findByIdAndDelete({_id:id});

        //return response
        return res.status(200).json({
            success:true, 
            message:'User deleted successfully',
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'User cannot be deleted successfully',
        });
    }
}

exports.getAllUserDetails = async (req, res) => {
    try{
        //get id
        const id = req.user.id;

        //validation and get user details
        const userDetails = await User.findById(id).populate("additionalDetails").exec();

        if (!userDetails) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        console.log(userDetails);

        //return response
        return res.status(200).json({
            success:true,
            message:'User Data fetched successfully',
            data: userDetails,
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}

// Update Display Picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.files.displayPicture; // requires express-fileupload

    const image = await uploadImageToCloudinary(
      file,
      process.env.FOLDER_NAME,
      1000, // optional size
      1000
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: image.secure_url },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Display picture updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Enrolled Courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate("courses") // assuming User model has a courses field
      .exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enrolled courses fetched successfully",
      data: user.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
