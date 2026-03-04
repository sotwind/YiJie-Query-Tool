const oracledb = require('oracledb');

const db = { 
    connectString: "36.138.132.30:1521/dbms",
    user: "read",
    password: "ejsh.read"
};

async function checkData() {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: db.user,
            password: db.password,
            connectString: db.connectString
        });
        
        // 查看 ord_ct 样例数据（带业务员）
        console.log("=== ord_ct 样例数据（带业务员）===");
        const sample1 = await connection.execute(`
            SELECT serial, prdesc, agntcde, clntcde, calprc, created 
            FROM ord_ct 
            WHERE agntcde IS NOT NULL AND ROWNUM <= 5
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        sample1.rows.forEach(row => {
            console.log(`单号:${row.SERIAL} | 产品:${row.PRDESC} | 业务员:${row.AGNTCDE} | 客户:${row.CLNTCDE} | 计算价:${row.CALPRC}`);
        });
        
        // 尝试 ord_ct 关联业务员
        console.log("\n=== ord_ct 关联业务员 ===");
        const joinSql = `
            SELECT t.serial, t.prdesc, c.clntnme, h.empnme, d.dptnme, t.calprc
            FROM ord_ct t
            LEFT JOIN pb_clnt c ON t.clntcde = c.clntcde
            LEFT JOIN hr_base h ON t.agntcde = h.mobile
            LEFT JOIN pb_dept d ON h.dptcde = d.dptcde
            WHERE t.isactive = 'Y' 
              AND t.agntcde IS NOT NULL
              AND ROWNUM <= 5
        `;
        const joinResult = await connection.execute(joinSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        joinResult.rows.forEach(row => {
            console.log(`单号:${row.SERIAL} | 产品:${row.PRDESC} | 客户:${row.CLNTNME} | 业务员:${row.EMPNME} | 部门:${row.DPTNME} | 计算价:${row.CALPRC}`);
        });
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkData();
