import ExcelJS from "exceljs";
import { getInsightAnalytics } from "../controllers/dashboardController";


export const generateInsightExcelSheet = async (filters) => {
  try {
    // 1️ Fetch all insights (use a fake res object to capture JSON)
    let insightsData;
    const fakeRes = {
      status: () => ({
        json: (d) => { insightsData = d.insights; },
      }),
    };
    await getInsightAnalytics({ query: filters }, fakeRes);

    const workBook = new ExcelJS.Workbook();

    // 2️ Category Analysis Sheet
    const categorySheet = workBook.addWorksheet("Category Analysis");
    categorySheet.columns = [
      { header: "Type", key: "type" },
      { header: "Category", key: "category" },
      { header: "Total", key: "total" },
      { header: "Percentage", key: "percentage" },
    ];

    const addCategoryRows = (data, type) => {
      if (!data) return;
      const items = type === "expense" ? data.expenseBreakdown : data.incomeBreakdown;
      items.forEach((cat) => {
        categorySheet.addRow({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          category: cat.category,
          total: cat.total,
          percentage: cat.percentage,
        });
      });
    };

    addCategoryRows(insightsData.categoryAnalysis, "expense");
    addCategoryRows(insightsData.categoryAnalysis, "income");

    // 3️ Trends Sheet
    const trendsSheet = workBook.addWorksheet("Trends");
    trendsSheet.columns = [
      { header: "Period", key: "period" },
      { header: "Income", key: "income" },
      { header: "Expense", key: "expense" },
      { header: "Income Growth %", key: "incomeGrowth" },
      { header: "Income Trend", key: "incomeTrend" },
      { header: "Expense Growth %", key: "expenseGrowth" },
      { header: "Expense Trend", key: "expenseTrend" },
    ];

    insightsData.trends.trends.forEach((t) => {
      trendsSheet.addRow({
        period: t.period,
        income: t.totals.income,
        expense: t.totals.expense,
        incomeGrowth: t.incomeGrowth,
        incomeTrend: t.incomeTrend,
        expenseGrowth: t.expenseGrowth,
        expenseTrend: t.expenseTrend,
      });
    });

    // 4️ Spending Pattern Sheet
    const spendingSheet = workBook.addWorksheet("Spending Pattern");
    spendingSheet.columns = [
      { header: "Average Spending/Day", key: "avgSpendingPerDay" },
      { header: "Peak Spending Day", key: "peakDay" },
      { header: "Peak Amount", key: "peakAmount" },
      { header: "Most Frequent Category", key: "mostFrequentCategory" },
    ];

    const sp = insightsData.spendingPattern;
    spendingSheet.addRow({
      avgSpendingPerDay: sp.avgSpendingPerDay,
      peakDay: sp.peakSpending.day,
      peakAmount: sp.peakSpending.amount,
      mostFrequentCategory: sp.mostFrequentCategory?.category || "",
    });

    // Expense distribution (paginated)
    const distSheet = workBook.addWorksheet("Expense Distribution");
    distSheet.columns = [
      { header: "Category", key: "category" },
      { header: "Total", key: "total" },
      { header: "Percentage", key: "percentage" },
    ];
    sp.expenseDistribution.forEach((cat) => {
      distSheet.addRow({
        category: cat.category,
        total: cat.total,
        percentage: cat.percentage,
      });
    });

    // 5️ Top & Bottom Categories Sheet
    const topBottomSheet = workBook.addWorksheet("Top & Bottom Categories");
    topBottomSheet.columns = [
      { header: "Type", key: "type" },
      { header: "Top Categories", key: "top" },
      { header: "Bottom Categories", key: "bottom" },
    ];

    const tbc = insightsData.topBottomCategories;
    const maxLen = Math.max(tbc.topIncome.length, tbc.topExpense.length, tbc.bottomIncome.length, tbc.bottomExpense.length);
    for (let i = 0; i < maxLen; i++) {
      topBottomSheet.addRow({
        type: "Income",
        top: tbc.topIncome[i]?.category || "",
        bottom: tbc.bottomIncome[i]?.category || "",
      });
      topBottomSheet.addRow({
        type: "Expense",
        top: tbc.topExpense[i]?.category || "",
        bottom: tbc.bottomExpense[i]?.category || "",
      });
    }

    // 6️ Financial Health Sheet
    const healthSheet = workBook.addWorksheet("Financial Health");
    healthSheet.columns = [
      { header: "Metric", key: "metric" },
      { header: "Value", key: "value" },
    ];

    const fh = insightsData.financialHealth;
    healthSheet.addRows([
      { metric: "Total Income", value: fh.totalIncome },
      { metric: "Total Expense", value: fh.totalExpense },
      { metric: "Savings", value: fh.savings },
      { metric: "Savings Rate (%)", value: fh.savingsRate },
      { metric: "Expense to Income Ratio (%)", value: fh.expenseIncomeRatio },
      { metric: "Health Status", value: fh.healthStatus },
    ]);

    // 7️ Send Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=insights_report_${Date.now()}.xlsx`
    );

    await workBook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error exporting Insight Excel" });
  }
};