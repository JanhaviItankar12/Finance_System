import ExcelJS from "exceljs";
import { getSummaryData } from "../services/dashboard/summaryService.js";
import { getCategoryData, getTopCategories } from "../services/dashboard/categoryService.js";
import { getTrendsData } from "../services/dashboard/trendsService.js";
import { getGrowthData } from "../services/dashboard/growthService.js";
import { getRecentTransactions } from "../services/dashboard/recentTransactionService.js";


export const generateDashboardExcelSheet = async (allRecords) => {
    try {

        

        const summary = getSummaryData(allRecords);
        const categories = getCategoryData(allRecords);
        const trends = getTrendsData(allRecords);
        const { topIncomeCategories, topExpenseCategories } = getTopCategories(allRecords);
        const growth = getGrowthData(trends.monthlyTrends);
        const recentTransactions = getRecentTransactions(allRecords);

        const workBook = new ExcelJS.Workbook();

        // summary sheet
        const summarySheet = workBook.addWorksheet("Summary");

        summarySheet.columns = [
            { header: "Metric", key: "metric" },
            { header: "Value", key: "value" },
        ]

        summarySheet.addRows([
            { metric: "Total Income", value: summary.totalIncome },
            { metric: "Total Expense", value: summary.totalExpense },
            { metric: "Net Balance", value: summary.netBalance },
        ]);

        //mothly trend sheet
        const monthlytrendsSheet = workBook.addWorksheet("Monthly Trends");

        monthlytrendsSheet.columns = [
            { header: "Month", key: "month" },
            { header: "Income", key: "income" },
            { header: "Expense", key: "expense" }
        ];

        trends.monthlyTrends.forEach(t => {
            monthlytrendsSheet.addRow({
                month: t.label,
                income: t.income,
                expense: t.expense
            });
        });

        const weeklytrendsSheet = workBook.addWorksheet("Weekly Trends");

        weeklytrendsSheet.columns = [
            { header: "week", key: "week" },
            { header: "Income", key: "income" },
            { header: "Expense", key: "expense" }
        ];

        trends.weeklyTrends.forEach(t => {
            weeklytrendsSheet.addRow({
                week: t.label,
                income: t.income,
                expense: t.expense
            });
        });



        //category sheet
        const categorySheet = workBook.addWorksheet("Categories");

        categorySheet.columns = [
            { header: "Category", key: "category" },
            { header: "Total Amount", key: "amount" }
        ];

        categories.categoryChart.map(c => {
            categorySheet.addRow({
                category: c.label,
                amount: c.value
            });
        });

        const topSheet = workBook.addWorksheet("Top Categories");

        topSheet.columns = [
            { header: "Type", key: "type" },
            { header: "Category", key: "category" },
            { header: "Amount", key: "amount" }
        ];

        // Income categories
        topIncomeCategories.forEach(item => {
            topSheet.addRow({
                type: "Income",
                category: item.label,
                amount: item.value
            });
        });

        // Expense categories
        topExpenseCategories.forEach(item => {
            topSheet.addRow({
                type: "Expense",
                category: item.label,
                amount: item.value
            });
        });
        //recent transaction
        const recentSheet = workBook.addWorksheet("Recent Transactions");

        recentSheet.columns = [
            { header: "Date", key: "date" },
            { header: "Type", key: "type" },
            { header: "Category", key: "category" },
            { header: "Amount", key: "amount" },
            { header: "Notes", key: "notes" }
        ];

        recentTransactions.forEach(r => {
            recentSheet.addRow({
                date: new Date(r.date).toISOString().split("T")[0],
                type: r.type,
                category: r.category,
                amount: r.amount,
                notes: r.note
            });
        });

        //growth 
        const growthSheet = workBook.addWorksheet("Growth");

        growthSheet.columns = [
            { header: "Metric", key: "metric" },
            { header: "Value", key: "value" }
        ];

        growthSheet.addRows([
            { metric: "Growth (%)", value: growth.growth },
            { metric: "Multiplier", value: growth.multiplier }
        ]);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=dashboard_report_${Date.now()}.xlsx`
        );

        await workBook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error exporting Excel" });
    }
}