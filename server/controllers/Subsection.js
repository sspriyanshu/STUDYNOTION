const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//create SubSection

exports.createSubSection = async (req, res) => {
    try{
        //fetch data from Req body
        const {sectionId, title, timeDuration, description} = req.body;
        //extract file/video
        const video = req.files.video;

        //validation
        if(!sectionId || !title || !timeDuration || !description || !video){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        }

        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        //create a sub section
        const newSubSection = await SubSection.create({
            title,
            timeDuration,
            description,
            videoUrl: uploadDetails.secure_url,
        });

        // Update Section
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            { $push: { subSection: newSubSection._id } }, // make sure field name matches schema
            { new: true }
        ).populate({
            path: "subSection",
        });

        // Return full populated data
        return res.status(200).json({
            success: true,
            message: "SubSection created successfully",
            data: {
                updatedSection,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

//HW: upadateSubSection
exports.updateSubSection = async (req, res) => {
    try {
        const { subSectionId, title, timeDuration, description } = req.body;

        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: "SubSection ID is required",
            });
        }

        const updatedSubSection = await SubSection.findByIdAndUpdate(
            subSectionId,
            { title, timeDuration, description },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "SubSection updated successfully",
            updatedSubSection,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update SubSection",
            error: error.message,
        });
    }
};


//HW: deleteSubSection
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body;

        if (!subSectionId || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "SubSection ID and Section ID are required",
            });
        }

        // delete subsection
        const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

        if (!deletedSubSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        }

        // pull from section
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            { $pull: { subSection: subSectionId } },
            { new: true }
        ).populate("subSection");

        return res.status(200).json({
            success: true,
            message: "SubSection deleted successfully",
            updatedSection,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete SubSection",
            error: error.message,
        });
    }
};
