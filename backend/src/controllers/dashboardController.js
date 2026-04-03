import ExcelJS from "exceljs";
import Record from "../models/recordModel.js";
import { getCategoryData, getTopCategories } from "../services/dashboard/categoryService.js";
import { getGrowthData } from "../services/dashboard/growthService.js";
import { getRecentTransactions } from "../services/dashboard/recentTransactionService.js";
import { getSummaryData } from "../services/dashboard/summaryService.js";
import { getTrendsData } from "../services/dashboard/trendsService.js";
import { generateDashboardExcelSheet } from "../utils/generateDashboardExcelSheet.js";

//for admin and analyst
export const getDashboardSummary = async (req, res) => {
    try {

        //base filter:exclude soft-deleted
        const matchFilter = { isDeleted: false };

        const allRecords = await Record.find(matchFilter);

        const summary = getSummaryData(allRecords);
        const categories = getCategoryData(allRecords);
        const trends = getTrendsData(allRecords);
        const topCategories = getTopCategories(allRecords);
        const growth = getGrowthData(trends.monthlyTrends);
        const recentTransactions = getRecentTransactions(allRecords);


        // response
        return res.status(200).json({
            ...summary,
            ...categories,
            ...trends,
            topCategories,
            GrowthDetails: growth,
            recentTransactions

        });


    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server error" });
    }
}


export const exportDashboardExcel = async (req, res) => {
    try {
        const records = await Record.find({ isDeleted: false }); // default all


        const workbook = await generateDashboardExcelSheet(records);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=dashboard_report_${Date.now()}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error exporting Excel" });
    }
};








