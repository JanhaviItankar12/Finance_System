import Record from "../../models/recordModel.js1";

//admin and analyst can view it on dashboard
export const getCategoryAnalysis = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.query;


        // 1. Build match filter
        const matchFilter = { isDeleted: false };

        if (startDate && endDate) {
            matchFilter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // 2. Aggregation Pipeline
        const aggregation = [
            { $match: matchFilter },

            {
                $group: {
                    _id: { category: "$category", type: "$type" },
                    total: { $sum: "$amount" },
                },
            },

            {
                $group: {
                    _id: "$_id.type",
                    categories: {
                        $push: {
                            category: "$_id.category",
                            total: "$total",
                        },
                    },
                    grandTotal: { $sum: "$total" },
                },
            },
        ];

        const result = await Record.aggregate(aggregation);

        // 3. Separate income & expense
        let expenseData = [];
        let incomeData = [];
        let totalExpense = 0;
        let totalIncome = 0;

        result.forEach((item) => {
            if (item._id === "expense") {
                totalExpense = item.grandTotal;
                expenseData = item.categories.map((cat) => ({
                    ...cat,
                    percentage: totalExpense
                        ? ((cat.total / totalExpense) * 100).toFixed(2)
                        : 0,
                }));
            }

            if (item._id === "income") {
                totalIncome = item.grandTotal;
                incomeData = item.categories.map((cat) => ({
                    ...cat,
                    percentage: totalIncome
                        ? ((cat.total / totalIncome) * 100).toFixed(2)
                        : 0,
                }));
            }
        });

        // 4. Pagination helper
        const paginate = (data) => {
            const start = (page - 1) * limit;
            return data.slice(start, start + Number(limit));
        };

        // 5. Max/Min helper
        const getMaxMin = (data) => {
            if (!data.length) return { max: null, min: null };

            let max = data[0];
            let min = data[0];

            data.forEach((item) => {
                if (item.total > max.total) max = item;
                if (item.total < min.total) min = item;
            });

            return { max, min };
        };

        const expenseStats = getMaxMin(expenseData);
        const incomeStats = getMaxMin(incomeData);

        // 6. Response
        return res.status(200).json({
            filters: { startDate, endDate, page, limit },

            totalExpense,
            totalIncome,

            expenseBreakdown: paginate(expenseData),
            incomeBreakdown: paginate(incomeData),

            highestExpenseCategory: expenseStats.max,
            lowestExpenseCategory: expenseStats.min,

            highestIncomeCategory: incomeStats.max,
            lowestIncomeCategory: incomeStats.min,

            totalExpenseCategories: expenseData.length,
            totalIncomeCategories: incomeData.length,
        });


    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getUnifiedTrends = async (req, res) => {
    try {
        const { startDate, endDate, range = "monthly", page = 1, limit = 12 } = req.query;


        // 1️ Match filter (exclude soft-deleted)
        const matchFilter = { isDeleted: false };
        if (startDate && endDate) {
            matchFilter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // 2️ Grouping format
        let groupId = {};
        if (range === "weekly") {
            groupId = { year: { $year: "$date" }, week: { $isoWeek: "$date" } };
        } else {
            groupId = { year: { $year: "$date" }, month: { $month: "$date" } };
        }

        // 3️ Aggregation pipeline
        const aggregation = [
            { $match: matchFilter },

            {
                $group: {
                    _id: { ...groupId, type: "$type" },
                    totalAmount: { $sum: "$amount" },
                },
            },
            {
                $group: {
                    _id: "$_id",
                    typeTotals: { $push: { type: "$_id.type", total: "$totalAmount" } },
                },
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    week: "$_id.week",
                    totals: {
                        $arrayToObject: {
                            $map: {
                                input: "$typeTotals",
                                as: "t",
                                in: { k: "$$t.type", v: "$$t.total" },
                            },
                        },
                    },
                },
            },
            { $sort: range === "weekly" ? { year: 1, week: 1 } : { year: 1, month: 1 } },
        ];

        const trends = await Record.aggregate(aggregation);

        // 4️ Growth % & Trend Direction
        const enhancedTrends = trends.map((item, idx, arr) => {
            const prev = arr[idx - 1];
            const calculate = (current, previous) => {
                if (!previous) return { growth: null, trend: "stable" };
                const growth = ((current - previous) / previous) * 100;
                return {
                    growth: growth.toFixed(2),
                    trend: growth > 0 ? "increase" : growth < 0 ? "decrease" : "stable",
                };
            };

            const incomePrev = prev?.totals?.income || 0;
            const expensePrev = prev?.totals?.expense || 0;
            const incomeCurr = item.totals.income || 0;
            const expenseCurr = item.totals.expense || 0;

            const { growth: incomeGrowth, trend: incomeTrend } = calculate(incomeCurr, incomePrev);
            const { growth: expenseGrowth, trend: expenseTrend } = calculate(expenseCurr, expensePrev);

            return {
                period: range === "weekly" ? `Week ${item.week}, ${item.year}` : `${item.month}/${item.year}`,
                totals: item.totals,
                incomeGrowth,
                incomeTrend,
                expenseGrowth,
                expenseTrend,
            };
        });

        // 5️ Pagination
        const start = (page - 1) * limit;
        const paginatedTrends = enhancedTrends.slice(start, start + Number(limit));

        // 6️ Response
        return res.status(200).json({
            range,
            filters: { startDate, endDate, page, limit },
            totalPeriods: enhancedTrends.length,
            trends: paginatedTrends,
        });


    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getSpendingPattern = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.query;


        // 1️ Base filter
        const matchFilter = { isDeleted: false, type: "expense" };
        if (startDate && endDate) {
            matchFilter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // 2️ Aggregation pipeline
        const aggregation = [
            { $match: matchFilter },

            // Group by day
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: "$date" },
                        month: { $month: "$date" },
                        year: { $year: "$date" },
                        category: "$category",
                    },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },

            // Group by day for daily average
            {
                $group: {
                    _id: { day: "$_id.day", month: "$_id.month", year: "$_id.year" },
                    totalDay: { $sum: "$totalAmount" },
                    categories: { $push: { category: "$_id.category", total: "$totalAmount" } },
                },
            },

            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        ];

        const dailyData = await Record.aggregate(aggregation);

        // 3️ Calculate average, peak days, most frequent category
        let totalSpending = 0;
        let totalDays = dailyData.length;
        let categoryMap = {};

        let peakSpending = { day: null, amount: 0 };

        dailyData.forEach((day) => {
            const dayTotal = day.totalDay;
            totalSpending += dayTotal;

            // Peak day
            if (dayTotal > peakSpending.amount) {
                peakSpending = {
                    day: `${day._id.day}/${day._id.month}/${day._id.year}`,
                    amount: dayTotal,
                };
            }

            // Category count
            day.categories.forEach((cat) => {
                categoryMap[cat.category] = (categoryMap[cat.category] || 0) + cat.total;
            });
        });

        const avgSpendingPerDay = totalDays ? (totalSpending / totalDays).toFixed(2) : 0;

        // Most frequent category
        const categoryArray = Object.keys(categoryMap).map((cat) => ({
            category: cat,
            total: categoryMap[cat],
        }));

        categoryArray.sort((a, b) => b.total - a.total);
        const mostFrequentCategory = categoryArray[0] || null;

        // Expense distribution with pagination
        const start = (page - 1) * limit;
        const paginatedDistribution = categoryArray.slice(start, start + Number(limit)).map((cat) => ({
            ...cat,
            percentage: totalSpending ? ((cat.total / totalSpending) * 100).toFixed(2) : 0,
        }));

        // 4️ Response
        return res.status(200).json({
            avgSpendingPerDay,
            peakSpending,
            mostFrequentCategory,
            totalSpending,
            totalDays,
            expenseDistribution: paginatedDistribution,
            page,
            limit,
            totalCategories: categoryArray.length,
        });


    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getTopBottomCategories = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 5 } = req.query;


        // 1️ Base filter
        const matchFilter = { isDeleted: false };
        if (startDate && endDate) {
            matchFilter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // 2️ Aggregation pipeline: group by type + category
        const aggregation = [
            { $match: matchFilter },
            {
                $group: {
                    _id: { category: "$category", type: "$type" },
                    totalAmount: { $sum: "$amount" },
                },
            },
            {
                $group: {
                    _id: "$_id.type",
                    categories: {
                        $push: {
                            category: "$_id.category",
                            total: "$totalAmount",
                        },
                    },
                },
            },
        ];

        const result = await Record.aggregate(aggregation);

        // 3️ Separate income & expense
        let expenseData = [];
        let incomeData = [];

        result.forEach((item) => {
            if (item._id === "expense") {
                expenseData = item.categories.sort((a, b) => b.total - a.total);
            }
            if (item._id === "income") {
                incomeData = item.categories.sort((a, b) => b.total - a.total);
            }
        });

        // 4️ Top & bottom
        const paginate = (data) => {
            const start = (page - 1) * limit;
            return data.slice(start, start + Number(limit));
        };

        const topExpense = paginate(expenseData);
        const bottomExpense = paginate([...expenseData].reverse());
        const topIncome = paginate(incomeData);
        const bottomIncome = paginate([...incomeData].reverse());

        // 5️ Response
        return res.status(200).json({
            filters: { startDate, endDate, page, limit },

            topExpense,
            bottomExpense,
            topIncome,
            bottomIncome,

            totalExpenseCategories: expenseData.length,
            totalIncomeCategories: incomeData.length,
        });


    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getFinancialHealth = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;


        // 1️ Base filter
        const matchFilter = { isDeleted: false };
        if (startDate && endDate) {
            matchFilter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // 2️ Aggregate income & expense totals
        const aggregation = [
            { $match: matchFilter },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                },
            },
        ];

        const totals = await Record.aggregate(aggregation);

        let totalIncome = 0;
        let totalExpense = 0;

        totals.forEach((item) => {
            if (item._id === "income") totalIncome = item.totalAmount;
            if (item._id === "expense") totalExpense = item.totalAmount;
        });

        // 3️ Calculate ratios
        const savings = totalIncome - totalExpense;
        const savingsRate = totalIncome ? ((savings / totalIncome) * 100).toFixed(2) : 0;
        const expenseIncomeRatio = totalIncome ? ((totalExpense / totalIncome) * 100).toFixed(2) : 0;

        // 4️ Determine financial health
        let healthStatus = "Moderate";
        if (savingsRate >= 30) healthStatus = "Good";
        else if (savingsRate < 10) healthStatus = "Risky";

        // 5️ Chart-ready structure
        const chartData = [
            { label: "Income", value: totalIncome },
            { label: "Expense", value: totalExpense },
            { label: "Savings", value: savings },
        ];

        // 6️ Response
        return res.status(200).json({
            totalIncome,
            totalExpense,
            savings,
            savingsRate,
            expenseIncomeRatio,
            healthStatus,
            chartData,
        });


    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Server error" });
    }
};