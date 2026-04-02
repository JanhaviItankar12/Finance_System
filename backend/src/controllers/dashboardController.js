import { Parser } from "json2csv";
import Record from "../models/recordModel.js";
import { getCategoryData, getTopCategories } from "../services/dashboard/categoryService.js";
import { getGrowthData } from "../services/dashboard/growthService.js";
import { getRecentTransactions } from "../services/dashboard/recentTransactionService.js";
import { getSummaryData } from "../services/dashboard/summaryService.js";
import { getTrendsData } from "../services/dashboard/trendsService.js";

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

export const exportDashboardCSV = async (req, res) => {
    try {
        const matchFilter = { isDeleted: false };

        const allRecords = await Record.find(matchFilter);

        const summary = getSummaryData(allRecords);
        const trends = getTrendsData(allRecords);

        //CSV
        const csvData = trends.monthlyTrends.map(t => ({
            Month: t.label,
            TotalIncome: t.income,
            TotalExpense: t.expense,
            NetBalance: Math.max(0, t.income - t.expense)
        }));

        csvData.push({
            Month: "All Months",
            TotalIncome: summary.totalIncome,
            TotalExpense: summary.totalExpense,
            NetBalance: summary.netBalance
        });

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.header("Content-Type", "text/csv");
        res.attachment(`dashboard_summary_${Date.now()}.csv`);

        return res.send(csv);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server error" });
    }
}

export const exportWeeklyTrends = async (req, res) => {
    try {
        const records = await Record.find({ isDeleted: false });

        const trends = getTrendsData(records);

        const csvData = trends.weeklyTrends.map(item => ({
            week: item.label,
            TotalIncome: item.income,
            TotalExpense: item.expense,
            NetBalance: Math.max(0, item.income - item.expense)
        }));

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.header("Content-Type", "text/csv");
        res.attachment(`weekly_trends_${Date.now()}.csv`);

        return res.send(csv);

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server error" });
    }
}

export const exportCategoryCSV = async (req, res) => {
    try {
        const records = await Record.find({ isDeleted: false });

        const categories = getCategoryData(records);

        const csvData = categories.categoryChart.map(item => ({
            Category: item.label,
            TotalAmount: item.value
        }));

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.header("Content-Type", "text/csv");
        res.attachment(`category_report_${Date.now()}.csv`)

        return res.send(csv);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server error" });
    }
}


export const exportTopCategoriesCSV = async (req, res) => {
    try {
        const records = await Record.find({ isDeleted: false });

        const { topIncomeCategories, topExpenseCategories } = getTopCategories(records);

        const csvData = [];

        topIncomeCategories.map(item => {
            csvData.push({
                Type: "Income",
                Category: item.label,
                Amount: item.value
            });
        });

        topIncomeCategories.map(item => {
            csvData.push({
                Type: "Expense",
                Category: item.label,
                Amount: item.value
            });
        });

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.header("Content-Type", "text/csv");
        res.attachment(`top_categories_${Date.now()}.csv`)

        return res.send(csv);

    } catch (error) {

    }
}