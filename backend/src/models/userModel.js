import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\S+@\S+\.\S+$/,
                "Please use a valid email address"
            ]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            validate: {
                validator: function (value) {
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(value)
                },
                message: "Password must include uppercase, lowercase, number, and special character"
            }
        },
        role: {
            type: String,
            enum: ["viewer", "analyst", "admin"],
            default: "viewer"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        deactivationReason: {
            type: String
        },
        deactivatedAt: {
            type: Date
        },
        deactivatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        activationRequested:{
            type:Boolean,
            default:false
        },
        resetOtp: String,
        resetOtpExpiry: Date,

        failedAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: {
            type: Date
        },

        //for admin+analyst 
        mfaOtp: String,
        mfaExpiry: Date,
        isMfaVerified: {
            type: Boolean,
            default: false
        }


    },
    { timestamps: true }
);


// hash password before saving
userSchema.pre("save", async function () {

    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);



});

//compare password during login
userSchema.methods.comparePassword = async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);
};


export default mongoose.model("User", userSchema);