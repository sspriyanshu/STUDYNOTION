const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");
const { resetPassword } = require("./ResetPassword");

exports.createSection = async (req, res) => {
    try{
        //data fetch
        const {sectionName, courseId} = req.body;

        //data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:'Missing required Properties',
            });
        }

        //create a new section with the given name
        const newSection = await Section.create({sectionName});
        
        //Add the new section to the course's content array
        const updatedCourse = await Course.findByIdAndUpdate(courseId,
            {
                $push:{
                    courseContent:newSection._id,
                }
            },
            {new:true},
        ).populate({
            path: "courseContent",
            populate: {
                path: "subSection", // assuming subsection array is called `subSection`
            },
        });

        //HW: use populate to replace sections/sub-sections both in the upadatedCourseDetails 

        //return response
        return res.status(200).json({
            success:true,
            message:'Section created successfully',
            updatedCourse,
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Internal severs error",
            error: error.message,
        });
    }
}

exports.updateSection = async (req, res) => {
    try{
        //data input 
        const {sectionName, sectionId} = req.body;

        //data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false, 
                message:'Missing Properties',
            });
        }

        //update data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new:true});

        //return response
        return res.status(200).json({
            success:true,
            message:'Section Updated Successfully',
            section,
        });

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to update Section, please try again",
            error:error.message,
        });
    }
};

exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;

    // Validation
    if (!sectionId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Section ID and Course ID are required",
      });
    }

    // Find the section
    const section = await Section.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Delete all SubSections under this section
    await SubSection.deleteMany({ _id: { $in: section.subSection } });

    // Delete the Section itself
    await Section.findByIdAndDelete(sectionId);

    // Remove reference from the specified Course
    await Course.findByIdAndUpdate(
      courseId,
      { $pull: { courseContent: sectionId } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Section and its SubSections deleted successfully from the course",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete Section, please try again",
      error: error.message,
    });
  }
};