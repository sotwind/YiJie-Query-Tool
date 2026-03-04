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
        
        console.log("查找 ord_bas 表所有字段...");
        const cols = await connection.execute(`
            SELECT column_name 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_BAS' 
            ORDER BY column_id
        `);
        
        console.log("\nORD_BAS 所有字段:");
        cols.rows.forEach(row => {
            console.log(`  ${row[0]}`);
        });
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkTable();
