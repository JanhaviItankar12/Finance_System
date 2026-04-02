import { Parser } from "json2csv";
import AuditLog from "../models/auditLogModel.js";

export const getAuditLogs = async (req, res) => {
  try {
    const {
        action,userId,startDate,endDate,page=1,
        limit=10
    }=req.query;

    

    const filter={};

    if(action){
        filter.action={ $in: action.split(",") };
    }

    if(userId){
        filter.performedBy=userId;
    }

    if(startDate || endDate){
        filter.createdAt={};
        if(startDate) filter.createdAt.$gte=new Date(startDate);
        if(endDate) filter.createdAt.$lte=new Date(endDate);

    }

    const skip=(parseInt(page-1)*parseInt(limit));

    const logs = await AuditLog.find(filter)
      .populate("performedBy", "name email role")
      .populate("recordId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalLogs = await AuditLog.countDocuments(filter);

     return res.status(200).json({
      total: totalLogs,
      page: parseInt(page),
      totalPages: Math.ceil(totalLogs / limit),
      count: logs.length,
      logs
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Server error" });
  }
};


export const exportAuditLogsCSV=async(req,res)=>{
     try {
         const {action,userId,startDate,endDate}=req.query;

         const filter={};

         if(action){
            filter.action={$in:action.split(",")};
         }

         if(userId){
            filter.performedBy=userId
         }

         if(startDate || endDate){
            filter.createdAt={};
            if(startDate) filter.createdAt.$gte=new Date(startDate);
            if(endDate) filter.createdAt.$lte=new Date(endDate);
         }

         //fetch logs
         const logs=await AuditLog.find(filter)
         .populate("performedBy","name email,role")
         .populate("recordId","amount type category")
         .sort({createdAt:-1});

         //format data for csv
         const formattedLogs=logs.map(log=>({
            Action:log.action,
            User:log.performedBy?.name,
            Email:log.performedBy?.email,
            Role:log.role,
            RecordId:log.recordId?._id,
            Amount:log.recordId?.amount,
            Type:log.recordId?.type,
            Category:log.recordId?.category,
            Date:new Date(log.createdAt).toISOString().slice(0, 10),
            Time: new Date(log.createdAt).toISOString().slice(11, 19)

         }));

         //convert to CSV
         const json2csvParser=new Parser();
         const csv=json2csvParser.parse(formattedLogs);

         //set headers for download
         res.header("Content-Type","text/csv");
         res.attachment(`audit_logs_${Date.now()}.csv`);

         return res.send(csv);
     } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
     }
}

