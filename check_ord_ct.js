const oracledb = require('oracledb');

const db = { 
    connectString: "36.138.132.30:1521/dbms",
    user: "read",
    password: "ejsh.read"
};

async function checkTable() {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: db.user,
            password: db.password,
            connectString: db.connectString
        });
        
        console.log("查找 ord_ct 表所有字段...");
        const cols = await connection.execute(`
            SELECT column_name 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_CT' 
            ORDER BY column_id
        `);
        
        console.log("\nORD_CT 所有字段:");
        cols.rows.forEach(row => console.log(`  ${row[0]}`));
        
        console.log("\n查找 ord_ct 表金额相关字段...");
        const amtCols = await connection.execute(`
            SELECT column_name, data_type 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_CT' 
            AND (column_name LIKE '%AMT%' OR column_name LIKE '%PRC%' OR column_name LIKE '%PRICE%')
            ORDER BY column_id
        `);
        
        console.log("\n金额/价格相关字段:");
        amtCols.rows.forEach(row => console.log(`  ${row[0]} (${row[1]})`));
        
        console.log("\n查看 ord_ct 前 3 条数据...");
        const sample = await connection.execute(`
            SELECT serial, prdesc, agntcde, clntcde, created, calprc 
            FROM ord_ct 
            WHERE ROWNUM <= 3
        `);
        console.log("样例数据:");
        sample.rows.forEach(row => {
            console.log(`  单号:${row[0]} | 产品:${row[1]} | 业务员:${row[2]} | 客户:${row[3]} | 日期:${row[4]} | 计算价:${row[5]}`);
        });
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkTable();
