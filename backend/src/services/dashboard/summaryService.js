export const getSummaryData = (records) => {


    //split locked and unlocked
    const lockedRecords = records.filter(r => r.isLocked);
    const unlockedRecords = records.filter(r => !r.isLocked);

    //total income/expense/net balance
    const totalIncome = records
        .filter(r => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);

    const totalLockedIncome = lockedRecords
        .filter(r => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);

    const totalUnlockedIncome = unlockedRecords
        .filter(r => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);

    const totalExpense = records
        .filter(r => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);

    const totalLockedExpense = lockedRecords
        .filter(r => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);


    const totalUnlockedExpense = unlockedRecords
        .filter(r => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);

    const netBalance = totalIncome - totalExpense;

    //income vs expense ratio
    const total = totalIncome + totalExpense;
    const incomeRatio = total ? (totalIncome / total) * 100 : 0;
    const expenseRatio = total ? (totalExpense / total) * 100 : 0;

    return {
        totalIncome,
        totalExpense,
        lokedUnlockedData: {
            totalLockedIncome,  //fixed
            totalUnlockedIncome,    //can be modifed in future 
            totalLockedExpense,
            totalUnlockedExpense,
        },
        netBalance,
        incomeExpenseRatio: {
                incomeRatio: incomeRatio.toFixed(2),
                expenseRatio: expenseRatio.toFixed(2)
            },
    }
}