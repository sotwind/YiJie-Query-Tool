const oracledb = require('oracledb');

const db = {
    connectString: "36.137.213.189:1521/dbms",
    user: "read",
    password: "ejsh.read"
};

async function querySchema() {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: db.user,
            password: db.password,
            connectString: db.connectString
        });

        console.log("正在查询 ord_ct 表结构 (服务器: 36.137.213.189 - 临海老系统)...\n");

        // 查询表字段信息
        const result = await connection.execute(`
            SELECT
                c.column_name,
                c.data_type,
                c.data_length,
                c.nullable,
                cc.comments
            FROM all_tab_columns c
            LEFT JOIN all_col_comments cc ON c.table_name = cc.table_name
                AND c.column_name = cc.column_name
                AND c.owner = cc.owner
            WHERE c.owner = 'EJSH' AND c.table_name = 'ORD_CT'
            ORDER BY c.column_id
        `);

        console.log("=".repeat(100));
        console.log("ORD_CT 表字段列表");
        console.log("=".repeat(100));
        console.log(`序号 | 字段名 | 数据类型 | 长度 | 可空 | 中文注释`);
        console.log("-".repeat(100));

        result.rows.forEach((row, index) => {
            const colName = row[0];
            const dataType = row[1];
            const dataLength = row[2];
            const nullable = row[3];
            const comments = row[4] || '';
            console.log(`${(index + 1).toString().padStart(3)} | ${colName.padEnd(25)} | ${dataType.padEnd(15)} | ${dataLength.toString().padStart(6)} | ${nullable.padEnd(4)} | ${comments}`);
        });

        // 查询 objtyp 字段是否存在
        console.log("\n" + "=".repeat(100));
        console.log("订单类型(objtyp)字段查询");
        console.log("=".repeat(100));

        const objtypResult = await connection.execute(`
            SELECT column_name, data_type, data_length, nullable, comments
            FROM all_tab_columns c
            LEFT JOIN all_col_comments cc ON c.table_name = cc.table_name
                AND c.column_name = cc.column_name
                AND c.owner = cc.owner
            WHERE c.owner = 'EJSH' AND c.table_name = 'ORD_CT'
            AND (c.column_name LIKE '%TYP%' OR c.column_name LIKE '%TYPE%')
            ORDER BY c.column_id
        `);

        if (objtypResult.rows.length > 0) {
            console.log("找到以下类型相关字段:");
            objtypResult.rows.forEach(row => {
                console.log(`  - 字段名: ${row[0]}, 类型: ${row[1]}(${row[2]}), 可空: ${row[3]}, 注释: ${row[4] || '无'}`);
            });
        } else {
            console.log("未找到 objtyp 或类似字段");
        }

        // 查询 ordtyp 字段
        const ordtypResult = await connection.execute(`
            SELECT column_name, data_type, data_length, nullable, comments
            FROM all_tab_columns c
            LEFT JOIN all_col_comments cc ON c.table_name = cc.table_name
                AND c.column_name = cc.column_name
                AND c.owner = cc.owner
            WHERE c.owner = 'EJSH' AND c.table_name = 'ORD_CT'
            AND c.column_name = 'ORDTYP'
        `);

        if (ordtypResult.rows.length > 0) {
            console.log("\n【订单类型字段详情】");
            ordtypResult.rows.forEach(row => {
                console.log(`  字段名: ${row[0]}`);
                console.log(`  数据类型: ${row[1]}(${row[2]})`);
                console.log(`  可空性: ${row[3]}`);
                console.log(`  中文注释: ${row[4] || '无'}`);
            });
        }

        await connection.close();
        console.log("\n查询完成!");

    } catch (err) {
        console.error("错误:", err.message);
        if (connection) try { await connection.close(); } catch (e) {}
    }
}

querySchema();
