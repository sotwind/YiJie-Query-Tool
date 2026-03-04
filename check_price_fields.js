const oracledb = require('oracledb');

const db = { 
    connectString: "36.138.132.30:1521/dbms",
    user: "read",
    password: "ejsh.read"
};

async function checkFields() {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: db.user,
            password: db.password,
            connectString: db.connectString
        });
        
        // 查看 ord_bas 所有金额/价格/数量相关字段
        console.log("=== ord_bas 金额/价格/数量相关字段 ===");
        const cols = await connection.execute(`
            SELECT column_name, data_type 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'ORD_BAS' 
            AND (column_name LIKE '%AMT%' OR column_name LIKE '%PRC%' OR column_name LIKE '%NUM%' OR column_name LIKE '%QTY%')
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        cols.rows.forEach(row => {
            console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`);
        });
        
        // 查看实际数据
        console.log("\n=== 实际数据样例（包含所有金额数量字段）===");
        const sample = await connection.execute(`
            SELECT serial, prdnme, 
                   quoprc, accamt, prices, accnum, ordnum, prenum,
                   calprc, inprice, squprc, annamt, dlvamt, othamt
            FROM ord_bas 
            WHERE ROWNUM <= 5
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        sample.rows.forEach(row => {
            console.log(`\n单号:${row.SERIAL} | 产品:${row.PRDNME}`);
            console.log(`  QUOPRC(报价):${row.QUOPRC} | ACCAMT(总额):${row.ACCAMT} | PRICES(单价):${row.PRICES}`);
            console.log(`  ACCNUM(数量):${row.ACCNUM} | ORDNUM(订单数):${row.ORDNUM} | PRENUM(赠品):${row.PRENUM}`);
            console.log(`  CALPRC(计算价):${row.CALPRC} | INPRICE(平方价):${row.INPRICE} | SQUPRC:${row.SQUPRC}`);
            console.log(`  验证：PRICES*ACCNUM = ${row.PRICES} * ${row.ACCNUM} = ${(row.PRICES * row.ACCNUM).toFixed(2)}`);
            console.log(`  验证：QUOPRC*ACCNUM = ${row.QUOPRC} * ${row.ACCNUM} = ${(row.QUOPRC * row.ACCNUM).toFixed(2)}`);
        });
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkFields();
