const oracledb = require('oracledb');
const fs = require('fs');

// 数据库配置
const databases = [
    { 
        name: "老厂新系统", 
        connectString: "36.138.132.30:1521/dbms",
        user: "read",
        password: "ejsh.read"
    },
    { 
        name: "温森新系统", 
        connectString: "db.05.forestpacking.com:1521/dbms",
        user: "read",
        password: "ejsh.read"
    }
];

// 修复后的 SQL：报价总金额 = QUOPRC * ACCNUM
const sql = `
SELECT * FROM (
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    h.empnme as 业务员，
    d.dptnme as 部门，
    nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 报价总金额，
    nvl(b.accamt, 0) as 卖价总金额，
    nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 利润差额，
    case 
        when nvl(b.quoprc, 0) * nvl(b.accnum, 0) = 0 then 0
        else (nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) / (nvl(b.quoprc, 0) * nvl(b.accnum, 0)) * 100
    end as 利率
FROM ord_bas b
LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ord_ct t ON b.serial = t.serial
LEFT JOIN hr_base h ON t.agntcde = h.mobile
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
            
            const result = await connection.execute(sql, {
                start_date: startStr,
                end_date: endStr
            }, {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });
            
            if (result.rows.length > 0) {
                for (const row of result.rows) {
                    results.push(`📅 ${row.日期} | 单号：${row.单号} | 客户：${row.客户}`);
                    results.push(`   产品：${row.产品} | 业务员：${row.业务员} | 部门：${row.部门}`);
                    results.push(`   💰 报价：¥${Number(row.报价总金额||0).toLocaleString('zh-CN', {minimumFractionDigits: 2})} | 卖价：¥${Number(row.卖价总金额||0).toLocaleString('zh-CN', {minimumFractionDigits: 2})} | 利润：¥${Number(row.利润差额||0).toLocaleString('zh-CN', {minimumFractionDigits: 2})} | 利率：${Number(row.利率||0).toFixed(2)}%`);
                    results.push("");
                }
            } else {
                results.push("   无数据\n");
            }
            
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
    
    fs.writeFileSync('/tmp/利润统计查询结果_修复版.txt', output, 'utf-8');
}

runQuery().catch(console.error);
