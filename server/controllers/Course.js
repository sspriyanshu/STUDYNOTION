const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//createCourse handler function 
exports.createCourse = async (req, res) => {
    try {
        //fetch data
        const { courseName, courseDescription, whatYouWillLearn, price, category ,tag} = req.body;

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        //check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: 'Instructor Details not found',
            });
        }

        // ensure user is actually an instructor
        if (instructorDetails.accountType !== "Instructor") {
            return res.status(403).json({
                success: false,
                message: "User is not authorized to create a course",
            });
        }

        //check given tag is valid
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: 'Category Details not found',
            });
        }

        //Upload Image to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        //create new Course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            tag,
            status: "Draft",
        });

        //add course to instructor
        await User.findByIdAndUpdate(
            instructorDetails._id,
            { $push: { courses: newCourse._id } },
            { new: true }
        );

        //add course to tag
        await Category.findByIdAndUpdate(
            categoryDetails._id,
            { $push: { courses: newCourse._id } },
            { new: true }
        );

        //response
        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: newCourse,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create Course',
            error: error.message,
        });
    }
};


//getAllCourses handler function

exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find({}, {
            courseName: true,
            courseDescription: true,
            price: true,
            thumbnail: true,
            instructor: true,
            category: true,
        })
        .populate("instructor", "firstName lastName email")
        .populate("category", "name description");

        return res.status(200).json({
            success: true,
            message: 'All courses fetched successfully',
            data: allCourses,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot fetch course data',
            error: error.message,
        });
    }
};

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
    try{
        //get id
        const {courseId} = req.body;

        //find course details
        const courseDetails = await Course.find({_id:courseId}).populate({
            path:"instructor",
            populate:{
                        path:"additionalDetails",
                    },
            }
        ).populate("category")
        // .populate("RatingAndReview",) 
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            },
        }).exec();

        //validation 
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find the course with ${courseId}`,
            });
        }

        //return response
        return res.status(200).json({
            success:true,
            message:"Course detailes fetched successfully",
            data:courseDetails,
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// controllers/Course.js

exports.approveCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        // check admin
        if (req.user.accountType !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can approve courses"
            });
        }

        // find course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // update status
        course.status = "Published";
        await course.save();

        return res.status(200).json({
            success: true,
            message: "Course approved and published successfully",
            data: course,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error approving course",
            error: error.message,
        });
    }
};
