import { generateToken } from "../utils/generateToken.js";
import User from "./../models/userModel.js"

// register
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        //check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const user=await User.create({
            name,
            email,
            password,
            role:role || "viewer",  //default role
        });
        
        // generate token
        const token=generateToken(user);
        
        return res.status(201).json({
            message:"User registered successfully",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
            }
        })




    } catch (error) {

        if(error.name==="ValidationError"){
            return res.status(400).json({
                message:Object.values(error.errors)
                .map(err=>err.message)
                .join(", ")
            });
        }
       return res.status(500).json({
          message:error.message
       });
    }
};

//login
export const  login=async(req,res)=>{
    try {
       const {email,password} =req.body;
       
       //validation    
       if(!email || !password){
        return res.status(400).json({
            message:"Email and password required"
        });
       }

       //check user
       const user=await User.findOne ({email});
       if(!user){
        return res.status(400).json({
            message:"Invalid credentials"
        });
       }

       //check if active
       if(!user.isActive) {
         return res.status(403).json({
            message:"User is inactive"
         })
       } 
       
       //compare password
       const isMatch=await user.comparePassword(password);
       if(!isMatch){
        return res.status(400).json({
            message:"Invalid credentials"
        });
       }  

       //generate token
       const token=generateToken(user); 

       res.cookie("token",token,{
        httpOnly:true,
        secure:false,  //true is production-HTTPS
        sameSite:"lax",
        maxAge:24*60*60*1000  //1 day
       });
       
       res.status(200).json({
        message:"Login successful",
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role
        }
       });

    } catch (error) {

        
        res.status(500).json({
            message:error.message
        })
    }
}

