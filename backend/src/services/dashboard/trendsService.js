export const getTrendsData = (records) => {

    const monthlyMap = {};
    const weeklyMap = {};

    records.forEach(r => {
        const date = new Date(r.date);

        // -------- MONTHLY --------
        const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap[mKey]) monthlyMap[mKey] = { income: 0, expense: 0 };

        if (r.type === "income") monthlyMap[mKey].income += r.amount;
        else monthlyMap[mKey].expense += r.amount;

        // -------- WEEKLY --------
        const year = date.getFullYear();
        const firstDay = new Date(year, 0, 1);
        const week = Math.ceil(((date - firstDay) / 86400000 + firstDay.getDay() + 1) / 7);

        const startOfWeek = new Date(firstDay.getTime() + (week - 1) * 7 * 86400000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 86400000);

        const wKey = `${startOfWeek.toISOString().slice(0, 10)} to ${endOfWeek.toISOString().slice(0, 10)}`;

        if (!weeklyMap[wKey]) weeklyMap[wKey] = { income: 0, expense: 0 };

        if (r.type === "income") weeklyMap[wKey].income += r.amount;
        else weeklyMap[wKey].expense += r.amount;
    });

    //  Chart-ready format
    const monthlyTrends = Object.keys(monthlyMap)
        .sort()
        .map(key => ({
            label: key,
            income: monthlyMap[key].income,
            expense: monthlyMap[key].expense
        }));

    const weeklyTrends = Object.keys(weeklyMap)
        .sort()
        .map(key => ({
            label: key,
            income: weeklyMap[key].income,
            expense: weeklyMap[key].expense
        }));

    return { monthlyTrends, weeklyTrends };
};