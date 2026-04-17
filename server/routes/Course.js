const express = require("express");
const router = express.Router();

const {auth, isInstructor, isStudent, isAdmin} = require("../middlewares/auth");

const { createCourse, getAllCourses, getCourseDetails } = require("../controllers/Course");

const { createCategory, showAllCategories, categoryPageDetails } = require("../controllers/Category");

const {createRating, getAverageRating, getAllRating} = require("../controllers/RatingAndReview")

const{createSection, updateSection, deleteSection} = require("../controllers/Section")

const { createSubSection, updateSubSection, deleteSubSection } = require("../controllers/Subsection");

const { approveCourse } = require("../controllers/Course");


router.post("/createCourse", auth, isInstructor, createCourse)
router.post("/getCourseDetails", getCourseDetails)
router.get("/getAllCourses", getAllCourses)

router.post("/addSection", auth, isInstructor, createSection)
router.post("/updateSection", auth, isInstructor, updateSection)
router.post("/deleteSection", auth, isInstructor, deleteSection);


router.post("/addSubSection", auth, isInstructor, createSubSection)
router.post("/updateSubSection", auth, isInstructor, updateSubSection)
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);


router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", showAllCategories)
router.post("/getCategoryPageDetails", categoryPageDetails)


router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)

router.put("/approveCourse", auth, isAdmin, approveCourse);

module.exports = router