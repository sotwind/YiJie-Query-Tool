const oracledb = require('oracledb');

const db = { 
    connectString: "36.138.132.30:1521/dbms",
    user: "read",
    password: "ejsh.read"
};

async function checkTables() {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: db.user,
            password: db.password,
            connectString: db.connectString
        });
        
        // 检查 ord_ct 表
        console.log("检查 ord_ct 表字段（找业务员和产品关联）...");
        const cols1 = await connection.execute(`
            SELECT column_name 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_CT' 
            AND (column_name LIKE '%AGNT%' OR column_name LIKE '%PID%' OR column_name LIKE '%PRD%')
            ORDER BY column_id
        `);
        console.log("ORD_CT 相关字段:");
        cols1.rows.forEach(row => console.log(`  ${row[0]}`));
        
        // 检查 ord_bas 是否有 PTDATE
        console.log("\n检查 ord_bas 日期字段...");
        const cols2 = await connection.execute(`
            SELECT column_name, data_type 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_BAS' 
            AND (column_name LIKE '%DATE%' OR column_name LIKE '%TIME%' OR column_name = 'CREATED')
        `);
        console.log("ORD_BAS 日期字段:");
        cols2.rows.forEach(row => console.log(`  ${row[0]} (${row[1]})`));
        
        // 查看实际数据样例
        console.log("\n查看 ord_bas 前 3 条数据...");
        const sample = await connection.execute(`
            SELECT serial, prdcde, prdnme, prices, accamt, quoprc, accnum, created 
            FROM ord_bas 
            WHERE ROWNUM <= 3
        `);
        console.log("样例数据:");
        sample.rows.forEach(row => {
            console.log(`  单号:${row[0]} | 产品码:${row[1]} | 产品名:${row[2]} | 单价:${row[3]} | 总额:${row[4]} | 报价:${row[5]} | 数量:${row[6]} | 日期:${row[7]}`);
        });
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkTables();
