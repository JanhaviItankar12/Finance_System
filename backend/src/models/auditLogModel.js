import mongoose from "mongoose";

const auditLogSchema=new mongoose.Schema({
    action:{
     type:String,
     enum:["CREATE","UPDATE","DELETE","LOCK","RESTORE"],
     required:true
    },
    recordId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Record",
        required:true
    },
    performedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true 
    },
    role:{
        type:String
    },
    oldData:{
        type:Object
    },
    newData:{
        type:Object
    }
},{timestamps:true});

export default mongoose.model("AuditLog",auditLogSchema);

