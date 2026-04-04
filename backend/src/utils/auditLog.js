import AuditLog from "../models/auditLogModel.js"



export const createAuditLog = async ({
  action,
  entityType,
  recordId,
  performedBy,
  role,
  targetUserId,
  oldData,
  newData,
  description
}) => {
  try {
    await AuditLog.create({
      action,
      entityType,
      recordId,
      performedBy,
      role,
      targetUserId,
      oldData,
      newData,
      description
    });
  } catch (err) {
    console.error("Audit Log Error:", err.message);
  }
};