import { createAuditLog } from "../utils/auditLog.js";
import Record from "./../models/recordModel.js";

//create record
export const createRecord = async (req, res) => {
    try {
        const { amount, type, category, date, notes } = req.body;


        // validation
        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({ message: "Invalid type" });
        }

        const record = await Record.create({
            createdBy: req.user._id,
            amount,
            type,
            category,
            date,
            notes

        });

    
        //audit log
        await createAuditLog({
            action: "CREATE",
            recordId: record._id,
            user: req.user,
            newData: record
        });

        return res.status(201).json({
            message: "Record created successfully!",
            record
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: "Server error"
        });
    }
}

//update record-admin  only
export const updateRecord = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid record ID" });
        }
        const record = await Record.findById(id);


        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        if (record.isDeleted) {
            return res.status(400).json({
                message: "Cannot update deleted record",
            });
        }

        // locked record cannot be update to prevent from corruption
        if (record.isLocked) {
            return res.status(400).json({
                message: "Locked record cannot be updated",
            });
        }

        const oldData = { ...record._doc };


        const updated = await Record.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        //audit log
        await createAuditLog({
            action: "UPDATE",
            recordId: record._id,
            user: req.user,
            oldData,
            newData: updated
        });

        return res.status(200).json(updated);
    } catch (error) {
        return res.status(500).json({
            message: "Server error"
        });
    }
};

//delete record-admin only
export const deleteRecord = async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }
        if (record.isDeleted) {
            return res.status(403).json({
                message: "Record already deleted"
            });
        }

        //record locked-published on dashboard
        if (record.isLocked) {
            return res.status(403).json({
                message: "Locked record cannot be deleted"
            });
        }

        record.isDeleted = true;
        await record.save();

        //audit log
        await createAuditLog({
            action: "DELETE",
            recordId: record._id,
            user: req.user,
            oldData: record
        });

        return res.status(200).json({
            message: "Record deleted."
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

//lock record-admin only
export const lockRecord = async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            })
        }

        if (record.isDeleted) {
            return res.status(400).json({
                message: "Cannot lock deleted record"
            });
        }

        if (record.isLocked) {
            return res.status(400).json({
                message: "Record already locked",
            });
        }

        record.isLocked = true;
        await record.save();

        //audit log
        await createAuditLog({
            action: "LOCK",
            recordId: record._id,
            user: req.user,
            oldData: record
        });

        res.status(200).json({
            message: "Record locked successfully",
        });


    } catch (error) {
        res.status(500).json({ message: "Server error" });

    }
}

// restore record-admin only 
export const restoreRecord = async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }

        if (!record.isDeleted) {
            return res.status(400).json({
                message: "Record is not deleted",
            });
        }

        const oldData = { ...record._doc };

        record.isDeleted = false;
        await record.save();

        await createAuditLog({
            action: "RESTORE",
            recordId: record._id,
            user: req.user,
            oldData,
            newData: record
        });

        res.status(200).json({
            message: "Record restored successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


//get records
export const getRecords = async (req, res) => {
    try {
        const { type, category, startDate, endDate, isLocked, page = 1, limit = 10 } = req.query;
        const filter = { isDeleted: false };  //only exclude soft-deleted records

        //filters
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        // search
        if (search) {
            filter.notes = { $regex: search, $options: "i" }; // case-insensitive
        }

        if(isLocked){
            filter.isLocked=isLocked;
        }

        const skip = (page - 1) * limit;

        const records = await Record.find(filter)
            .sort({ date: -1 })  //latest first
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const totalRecords = await Record.countDocuments(filter);

        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            sucess: true,
            totalRecords,
            totalPages,
            currentPage: parseInt(page),
            count: records.length,
            records
        }); 5


    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: "Server error"
        })
    }
}


