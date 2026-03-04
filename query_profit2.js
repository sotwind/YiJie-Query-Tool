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

// 先检查 ord_bas 表结构
async function checkTableStructure() {
    const db = databases[0];
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: db.user,
            password: db.password,
            connectString: db.connectString,
            thin: false
        });
        
        console.log("检查 ord_bas 表字段...");
        const result = await connection.execute(`
            SELECT column_name, data_type 
            FROM user_tab_columns 
            WHERE table_name = 'ORD_BAS' 
            ORDER BY column_id
        `);
        
        console.log("\nORD_BAS 表字段:");
        result.rows.forEach(row => {
            console.log(`  ${row[0]} (${row[1]})`);
        });
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkTableStructure();
