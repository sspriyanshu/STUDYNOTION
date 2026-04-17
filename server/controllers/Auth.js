const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");

//sendOTP
exports.sendotp = async(req, res) => {
    try{
        //fetch email from request ki body
        const {email} = req.body;

        //check if user already exist
        const checkUserPresent = await User.findOne({email});

        //if user already exist , then return a response
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:'User already registered',
            })
        }

        //generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP generated: ", otp);

        //check unique otp or not
        let result = await OTP.findOne({otp : otp});

        while(result){
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = await OTP.findOne({otp: otp});
        }

        const otpPayload = {email, otp};

        //create an entry for OTP
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //return response successful
        res.status(200).json({
            success: true,
            message:'OTP sent successfully',
            otp,
        })

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//signUp
exports.signup  = async (req, res) => {
    try{
        //data fetch from request ki body
        const{
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;

        //validate karo 
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success:false,
                message:"All fields are required",
            });
        }

        //check if password and confirm password match
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:'Password and ConfirmPassword value does not match, please try again'
            });
        }

        //check user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already exists. Please sign in to continue',
            });
        }

        //find most recent OTP stored for the user
        //const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 }); 
        //find return an array and findOne returns a single object
        const response = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        //-1 is used for descending order sorting 
        console.log(response);

        //validate OTP
        if(response.length === 0){
            //OTP not found for the email
            return res.status(400).json({
                success:false,
                message:'The OTP is not valid',
            });
        }else if(otp !== response[0].otp){
            //Invalid OTP
            return res.status(400).json({
                success:false,
                message:"The OTP is not valid",
            });
        }

        //Hash password 
        const hashedPassword = await bcrypt.hash(password, 10);

        //Create the user
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);
        
        //Create the additional profile for user
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            active: true,
            approved,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        //return res  
        return res.status(200).json({
            success:true,
            user,
            message:'User registered Successfully',
        })
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered. Please try again",
        })
    }
}

// Login controller for authenticating users
exports.login = async (req, res) => {
    try{
        //get email and password from request body
        const {email, password} = req.body;

        //check if email or password is missing
        if(!email || !password){
            //Return 400 Bad request status code with error message
            return res.status(403).json({
                success:false,
                message:'All fields are required, please try again',
            });
        }

        //Find user with provided email
        const user = await User.findOne({email}).populate("additionalDetails");

        //If user not found with provided email
        if(!user){
            //Return 401 unauthorized code with error message
            return res.status(401).json({
                success:false,
                message:"User is not registered, please signup first",
            });
        }

        //generate JWT, after password matching
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email: user.email,
                id: user._id,
                accountType:user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET,{
                expiresIn:"2h",
            });
            user.token = token;
            user.password = undefined;
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                httpOnly: true, // cannot be accessed by JS in frontend
                secure: true,   // set true in production (HTTPS)
                sameSite: "strict"
            };

            //create cookie and send response
            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user, 
                message:'Logged in successfully',
            })
        }
        else{
            return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            });
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login Failure, please try again',
        });
    }
};

//changePassword
//TODO: HOMEWORK
exports.changePassword = async (req, res) => {
    
    
    //get data from req body
    //get oldPassword, newPassword, confirmNewPassword
    //validation

    //update pwd in DB
    //send mail - Password upadated
    //return response

    try {
        // Step 1: Get data from req body
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // Step 2: Validation
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match",
            });
        }

        // Step 3: Get user from DB (req.user should be populated by auth middleware)
        const userId = req.user.id; // assuming you set req.user in JWT middleware
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Step 4: Compare old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect",
            });
        }

        // Step 5: Hash new password and save
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Step 6: (Optional) Send email notification
        try {
            await mailSender(
                user.email,
                "Password Changed Successfully",
                `Hello ${user.firstName}, your password has been updated successfully. If this wasn’t you, please reset your password immediately.`
            );
        } catch (error) {
            console.log("Error sending email:", error.message);
        }

        // Step 7: Response
        return res.status(200).json({
        success: true,
        message: "Password changed successfully",
        });
    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
        success: false,
        message: "Something went wrong while changing the password",
        });
    }
}