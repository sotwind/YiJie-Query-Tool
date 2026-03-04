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
        
        console.log("查找 ord_bas 表中的价格和金额相关字段...");
        const cols = await connection.execute(`
            SELECT column_name, data_type 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_BAS' 
            AND (column_name LIKE '%PRC%' OR column_name LIKE '%AMT%' OR column_name LIKE '%PRICE%')
            ORDER BY column_id
        `);
        
        console.log("\n价格/金额相关字段:");
        cols.rows.forEach(row => {
            console.log(`  ${row[0]} (${row[1]})`);
        });
        
        console.log("\n查找关联字段...");
        const cols2 = await connection.execute(`
            SELECT column_name, data_type 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_BAS' 
            AND (column_name LIKE '%PID%' OR column_name LIKE '%ID%' OR column_name LIKE '%CLNT%' OR column_name LIKE '%AGNT%')
            ORDER BY column_id
        `);
        
        console.log("\n关联/ID 字段:");
        cols2.rows.forEach(row => {
            console.log(`  ${row[0]} (${row[1]})`);
        });
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkTable();
