import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: ["CREATE", "UPDATE", "DELETE", "LOCK", "RESTORE", "DEACTIVATE", "REACTIVATE","EXPORT","LOGIN", "LOGOUT","LOCK","RESET_PASSWORD","FORGOT_PASSWORD"],
        required: true
    },

    entityType: {
        type: String,
        enum: ["Record", "User"],
        required: true
    },
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Record",

    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    role: {
        type: String,
        enum: ["admin", "analyst", "viewer"],
        required: true
    },
    oldData: {
        type: Object
    },
    newData: {
        type: Object
    },
    description: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);

