const oracledb = require('oracledb');

const db = { 
    name: "老厂新系统", 
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
        
        console.log("检查 ord_bas 表是否存在...");
        const result = await connection.execute(`SELECT COUNT(*) FROM ord_bas`);
        console.log("ord_bas 记录数:", result.rows[0][0]);
        
        console.log("\n检查 ord_bas 表字段 (使用 DBA_TAB_COLUMNS)...");
        const cols = await connection.execute(`
            SELECT column_name, data_type 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_BAS' 
            ORDER BY column_id
        `);
        
        console.log("\nFERP.ORD_BAS 表字段:");
        cols.rows.slice(0, 30).forEach(row => {
            console.log(`  ${row[0]} (${row[1]})`);
        });
        console.log(`  ... 共 ${cols.rows.length} 个字段`);
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkTable();
