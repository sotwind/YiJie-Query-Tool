const oracledb = require('oracledb');
const fs = require('fs');

// 数据库配置
const databases = [
    { 
        name: "老厂新系统", 
        connectString: "36.138.132.30:1521/dbms",
        user: "read",
        password: "ejsh.read"
    }
];

// 关联 ord_ct 和 ord_bas 的 SQL
const sql = `
SELECT * FROM (
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    h.empnme as 业务员，
    d.dptnme as 部门，
    nvl(b.quoprc, 0) as 报价金额，
    nvl(b.accamt, 0) as 卖价金额，
    nvl(b.accamt, 0) - nvl(b.quoprc, 0) as 利润差额，
    case 
        when nvl(b.quoprc, 0) = 0 then 0
        else (nvl(b.accamt, 0) - nvl(b.quoprc, 0)) / nvl(b.quoprc, 0) * 100
    end as 利率
FROM ord_bas b
LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN hr_base h ON b.prvcde = h.mobile
LEFT JOIN pb_dept d ON h.dptcde = d.dptcde
WHERE b.isactive = 'Y'
  AND b.created >= to_date(:start_date, 'yyyy-MM-dd')
  AND b.created < to_date(:end_date, 'yyyy-MM-dd')
ORDER BY b.created DESC, b.serial DESC
)
WHERE ROWNUM <= 3
`;

async function runQuery() {
    const results = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    for (const db of databases) {
        let connection;
        try {
            results.push(`\n📍 **${db.name}**（最近 7 天，3 条）\n`);
            
            connection = await oracledb.getConnection({
                user: db.user,
                password: db.password,
                connectString: db.connectString
            });
            
            // 先测试字段
            console.log("测试 PRVCDE 字段...");
            const testSql = `SELECT serial, prvcde, prdnme, quoprc, accamt, created FROM ord_bas WHERE ROWNUM <= 3`;
            const testResult = await connection.execute(testSql, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            console.log("样例:");
            testResult.rows.forEach(row => {
                console.log(`  单号:${row.SERIAL} | PRVCDE:${row.PRVCDE} | 产品:${row.PRDNME} | 报价:${row.QUOPRC} | 总额:${row.ACCAMT}`);
            });
            
            await connection.close();
        } catch (err) {
            results.push(`   ❌ 错误：${err.message}\n`);
            if (connection) {
                try { await connection.close(); } catch (e) {}
            }
        }
    }
    
    const output = results.join('\n');
    console.log(output);
}

runQuery().catch(console.error);
