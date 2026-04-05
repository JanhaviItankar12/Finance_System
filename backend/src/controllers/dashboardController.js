import ExcelJS from "exceljs";
import Record from "../models/recordModel.js";
import { getCategoryData, getGrowthData, getRecentTransactions, getSummaryData, getTopCategories, getTrendsData } from "../services/dashboard/summaryService.js";
import { generateDashboardExcelSheet } from "../utils/generateDashboardExcelSheet.js";
import { callInsightFunction } from "../helperFunctions/callInsightFunction.js";
import { getCategoryAnalysis, getFinancialHealth, getSpendingPattern, getTopBottomCategories, getUnifiedTrends } from "../services/insight/insightService.js";
import { generateInsightExcelSheet } from "../utils/generateInsightsExcelSheet.js";
import { createAuditLog } from "../utils/auditLog.js";


export const fetchDashboardSummaryData = async () => {
    const matchFilter = { isDeleted: false };

    const allRecords = await Record.find(matchFilter);

    const summary = getSummaryData(allRecords);
    const categories = getCategoryData(allRecords);
    const trends = getTrendsData(allRecords);
    const topCategories = getTopCategories(allRecords);
    const growth = getGrowthData(trends.monthlyTrends);
    const recentTransactions = getRecentTransactions(allRecords);

    return {
        summary,
        categories,
        trends,
        topCategories,
        growth,
        recentTransactions,
    };
};

//everyone can view
export const getDashboardSummary = async (req, res) => {
    try {
        const data = await fetchDashboardSummaryData();
        return res.status(200).json(data);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

//export excel - admin and analyst
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

        //audit log
        await createAuditLog({
            action: "EXPORT",
            entityType: "Record",
            performedBy: req.user.id,
            role: req.user.role,
            description: "Dashboard Excel exported"
        });

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getInsightAnalytics = async (req, res) => {
    try {
        // Extract filters from query
        const { startDate, endDate, page = 1, limit = 10, range = "monthly" } = req.query;

        // Prepare a request object for all functions
        const reqForInsights = {
            query: { startDate, endDate, endDate, page, limit, range },
        };

        // Call each insight function
        const categoryAnalysis = await callInsightFunction(getCategoryAnalysis, reqForInsights);
        const trends = await callInsightFunction(getUnifiedTrends, reqForInsights);
        const spendingPattern = await callInsightFunction(getSpendingPattern, reqForInsights);
        const topBottomCategories = await callInsightFunction(getTopBottomCategories, reqForInsights);
        const financialHealth = await callInsightFunction(getFinancialHealth, reqForInsights);

        // Consolidated response
        return res.status(200).json({
            filters: { startDate, endDate, page, limit, range },
            insights: {
                categoryAnalysis,
                trends,
                spendingPattern,
                topBottomCategories,
                financialHealth,
            },
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

export const exportInsightExcel = async (req, res) => {
    try {
        //  Extract filters from query
        const { startDate, endDate, page = 1, limit = 10, range = "monthly" } = req.query;

        // Call generateInsightExcelSheet to get the workbook
        const workbook = await generateInsightExcelSheet(req.query); // Pass filters only

        // Set headers for Excel download
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=insights_report_${Date.now()}.xlsx`
        );

        //audit log
        await createAuditLog({
            action: "EXPORT",
            entityType: "Record",
            performedBy: req.user._id,
            role: req.user.role,
            description: "Insight Excel exported"
        });

        // Stream workbook to client
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
    }
};























