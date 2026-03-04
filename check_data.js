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
        
        // 查看 ord_bas 样例数据
        console.log("=== ord_bas 样例数据 ===");
        const sample1 = await connection.execute(`
            SELECT serial, prdnme, clntcde, prvcde, quoprc, accamt, created 
            FROM ord_bas 
            WHERE ROWNUM <= 5
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        sample1.rows.forEach(row => {
            console.log(`单号:${row.SERIAL} | 产品:${row.PRDNME} | 客户:${row.CLNTCDE} | PRVCDE:${row.PRVCDE} | 报价:${row.QUOPRC} | 总额:${row.ACCAMT}`);
        });
        
        // 查看 hr_base 样例
        console.log("\n=== hr_base 样例数据 ===");
        const sample2 = await connection.execute(`
            SELECT mobile, empnme, dptcde 
            FROM hr_base 
            WHERE ROWNUM <= 5
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        sample2.rows.forEach(row => {
            console.log(`手机:${row.MOBILE} | 姓名:${row.EMPNME} | 部门:${row.DPTCDE}`);
        });
        
        // 尝试关联查询
        console.log("\n=== 尝试关联查询 ===");
        const joinSql = `
            SELECT b.serial, b.prdnme, c.clntnme, h.empnme, d.dptnme, b.quoprc, b.accamt
            FROM ord_bas b
            LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN hr_base h ON b.prvcde = h.mobile
            LEFT JOIN pb_dept d ON h.dptcde = d.dptcde
            WHERE b.isactive = 'Y' AND ROWNUM <= 5
        `;
        const joinResult = await connection.execute(joinSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        joinResult.rows.forEach(row => {
            console.log(`单号:${row.SERIAL} | 产品:${row.PRDNME} | 客户:${row.CLNTNME} | 业务员:${row.EMPNME} | 部门:${row.DPTNME} | 报价:${row.QUOPRC} | 总额:${row.ACCAMT}`);
        });
        
        await connection.close();
    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

checkData();
