import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: true
        },
        category: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String
        },
        isLocked: {
            type: Boolean,
            default: false
        },

        isDeleted: {
            type: Boolean,
            default: false
        }


    }, { timestamps: true }
);

export default mongoose.model("Record", recordSchema);