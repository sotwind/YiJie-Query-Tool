const oracledb = require('oracledb');

// 数据库配置
const databases = [
    { 
        name: "新厂新系统", 
        connectString: "36.134.7.141:1521/dbms",
        user: "b0003",
        password: "kuke.b0003"
    },
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

// 修复后的 SQL 查询（每个厂 3 条数据）
const sql = `
SELECT * FROM (
SELECT 
    TO_CHAR(t.ptdate, 'yyyy-MM-dd') as 日期，
    t.serial as 单号，
    c.clntnme as 客户，
    p.prdnme as 产品，
    h.empnme as 业务员，
    d.dptnme as 部门，
    nvl(t.quoprc, 0) as 报价金额，
    nvl(t.accamt, 0) as 卖价金额，
    nvl(t.accamt, 0) - nvl(t.quoprc, 0) as 利润差额，
    case 
        when nvl(t.quoprc, 0) = 0 then 0
        else (nvl(t.accamt, 0) - nvl(t.quoprc, 0)) / nvl(t.quoprc, 0) * 100
    end as 利率
FROM ord_bas t
LEFT JOIN pb_clnt c ON t.clntcde = c.clntcde
LEFT JOIN pb_prd_bas p ON t.pid = p.id
LEFT JOIN hr_base h ON t.agntcde = h.mobile
LEFT JOIN pb_dept d ON h.dptcde = d.dptcde
WHERE t.status = 'Y'
  AND t.ptdate >= to_date(:start_date, 'yyyy-MM-dd')
  AND t.ptdate < to_date(:end_date, 'yyyy-MM-dd')
ORDER BY t.ptdate DESC, t.serial DESC
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
                    results.push(`   💰 报价：¥${Number(row.报价金额).toLocaleString('zh-CN', {minimumFractionDigits: 2})} | 卖价：¥${Number(row.卖价金额).toLocaleString('zh-CN', {minimumFractionDigits: 2})} | 利润：¥${Number(row.利润差额).toLocaleString('zh-CN', {minimumFractionDigits: 2})} | 利率：${Number(row.利率).toFixed(2)}%`);
                    results.push("");
                }
            } else {
                results.push("   无数据\n");
            }
            
            await connection.close();
        } catch (err) {
            results.push(`   ❌ 连接失败：${err.message}\n`);
            if (connection) {
                try { await connection.close(); } catch (e) {}
            }
        }
    }
    
    const output = results.join('\n');
    console.log(output);
    
    // 保存到文件
    const fs = require('fs');
    fs.writeFileSync('/tmp/利润统计查询结果.txt', output, 'utf-8');
    console.log('\n\n结果已保存到 /tmp/利润统计查询结果.txt');
}

runQuery().catch(console.error);
