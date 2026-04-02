import AuditLog from "../models/auditLogModel.js"

export const createAuditLog=async({
    action,recordId,user,oldData=null,newData=null
})=>{
    try {
        await AuditLog.create({
            action,
            recordId,
            performedBy:user.id,
            role:user.role,
            oldData,
            newData
        });
    } catch (error) {
        console.log(error.message);

    }
}