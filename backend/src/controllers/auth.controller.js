const userModel =require("../models/user.model")
const jwt = require('jsonwebtoken')
const emailService = require("../services/email.service")
const tokenBlacklistModel = require("../models/blacklist.model")

/** 
* - user register controller 
* - POST /api/auth/register
*/
async function userRegisterController(req, res) {
    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({
        email: email
    });

    if (isExists) {
        return res.status(422).json({
            message: "User Already Exist with email.",
            status: "failed"
        });
    }

    const user = await userModel.create({
        email,
        password,
        name
    });

    // // Send registration email
    // await emailService.sendRegistrationEmail(
    //     user.email,
    //     user.name
    // );

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        {
            expiresIn: "3d"
        }
    );

    res.cookie("token", token);

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            systemUser: user.systemUser
        },
        token
    });
}

/** 
* - user login controller 
* - POST /api/auth/login
*/
async function userLoginController(req,res){
    const{email,password} = req.body
    
    const user = await userModel.findOne({email}).select("+password +systemUser")

    if(!user){
        return res.status(401).json({
            message:"Email or password is INVALID"
        })
    }
   const isValidPassword= await user.comparePassword(password)

   if(!isValidPassword){
    return res.status(401).json({
            message:"Email or password is INVALID"
        })
    }

    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{
    expiresIn:"3d" })

    res.cookie("token",token)

    res.status(200).json({
    user : {
        _id:user._id,
        email:user.email,
        name:user.name,
        systemUser:user.systemUser
    },
    token
})

    
}

async function userLogoutController(req, res) {
    const expiresAt = new Date(req.decodedToken.exp * 1000);

    await tokenBlacklistModel.updateOne(
        { token: req.token },
        { token: req.token, expiresAt },
        { upsert: true }
    );

    res.clearCookie("token");
    return res.status(200).json({ message: "Logout successful" });
}

/** 
* - get user email preference controller 
* - GET /api/auth/email-preference
*  curl -X GET http://localhost:3000/api/auth/email-preference -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YjA5Mjg1NmIzYjBjNjZhZGM5NDliOGQiLCJpYXQiOjE3OTU3Njc5OTQsImV4cCI6MTc5NjAyNzE5NH0.CpJsrMwpm605YY8vdWzDELuTkBwQwBLk-OLNdiDm5MU"
*/


async function userGetEmailPreferenceController(req, res) {
    try{
        const user = await userModel.findById(req.user._id);
        if(!user){
            return res.status(404).json({
                message: "User not found",
                status: "failed",
            })
        }
        return res.status(200).json({
                message: "Email Preference fetched",
                status: "success",
                recieveTransferEmails: user.recieveTransferEmails
        })
    }catch (error){
        return res.status(500).json({
            message: "Failed to fetch email preference",
            status:"failed"
        })
    }
}

/** 
* - update user email preference controller 
* - PATCH /api/auth/email-preference
* curl -X PATCH  http://localhost:3000/api/auth/email-preference -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YjA5Mjg1NmIzYjBjNjZhZGM5NDliOGQiLCJpYXQiOjE3OTU3Njc5OTQsImV4cCI6MTc5NjAyNzE5NH0.CpJsrMwpm605YY8vdWzDELuTkBwQwBLk-OLNdiDm5MU" -H "Content-Type: application/json" -d '{"recieveTransferEmails": true}'
*/

async function userUpdateEmailPreferenceController(req, res) {
    try{
        const {recieveTransferEmails} = req.body;
        if(typeof recieveTransferEmails !== "boolean"){
            return res.status(400).json({
                message: "recieveTransferEmails must be boolean",
                status: "failed"
            })
        }
        // const updatedUser = await userModel.findByIdAndUpdate(req.user._id, {recieveTransferEmails}, {new: true});
        // if(!updatedUser){
        //     return res.status(404).json({
        //         message: "User not found",
        //         status: "failed",
        //     })
        // }
        req.user.recieveTransferEmails = recieveTransferEmails
        await req.user.save();

        return res.status(200).json({
                message: "Email Preference updated successfully",
                status: "success",
                recieveTransferEmails: req.user.recieveTransferEmails
        })
    }catch (error){
        return res.status(500).json({
            message: "Failed to update email preference",
            status:"failed"
        })
    }
}
module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    userGetEmailPreferenceController,
    userUpdateEmailPreferenceController
}