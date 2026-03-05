/**
 * 检查字符编码问题
 */

const oracledb = require('oracledb');

const DB_CONFIG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function main() {
    console.log('========================================');
    console.log('检查字符编码问题');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 查询销售 1 部的原始数据
        console.log('【1】查询销售 1 部（使用子查询）：');
        const sql1 = `
            SELECT * FROM (
                SELECT empcde, empnme, dptnme, 
                       LENGTH(dptnme) as len,
                       DUMP(dptnme, 1016) as dump_hex
                FROM pb_dept_member 
                WHERE isactive = 'Y'
            )
            WHERE ROWNUM <= 15
            ORDER BY dptnme, empnme
        `;
        const result1 = await conn.execute(sql1, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        result1.rows.forEach(r => {
            console.log(`   "${r.DPTNME}" (len=${r.LEN}) - ${r.EMPNME} | hex: ${r.DUMP_HEX}`);
        });

        // 2. 使用 INSTR 代替 LIKE
        console.log('\n【2】使用 INSTR 查询：');
        const sql2 = `
            SELECT empcde, empnme, dptnme 
            FROM pb_dept_member 
            WHERE isactive = 'Y' 
              AND INSTR(dptnme, '销售 1 部') > 0
        `;
        const result2 = await conn.execute(sql2, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   找到 ${result2.rows.length} 人：`);
        result2.rows.forEach(r => {
            console.log(`     "${r.DPTNME}" - ${r.EMPNME}`);
        });

        // 3. 检查数据库字符集
        console.log('\n【3】数据库字符集：');
        const charsetSql = `SELECT * FROM nls_database_parameters WHERE parameter LIKE '%CHARACTERSET%'`;
        const charsetResult = await conn.execute(charsetSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        charsetResult.rows.forEach(r => {
            console.log(`   ${r.PARAMETER}: ${r.VALUE}`);
        });

        // 4. 尝试使用 NVL 处理 NULL
        console.log('\n【4】使用 NVL 处理：');
        const sql4 = `
            SELECT empcde, empnme, NVL(dptnme, '(NULL)') as dptnme
            FROM pb_dept_member 
            WHERE isactive = 'Y' 
              AND NVL(dptnme, 'X') = '销售 1 部'
        `;
        const result4 = await conn.execute(sql4, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   找到 ${result4.rows.length} 人`);

        // 5. 直接匹配前 5 个字符
        console.log('\n【5】使用 SUBSTR 匹配：');
        const sql5 = `
            SELECT empcde, empnme, dptnme 
            FROM pb_dept_member 
            WHERE isactive = 'Y' 
              AND SUBSTR(dptnme, 1, 4) = '销售 1 部'
        `;
        const result5 = await conn.execute(sql5, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   找到 ${result5.rows.length} 人：`);
        result5.rows.forEach(r => {
            console.log(`     "${r.DPTNME}" - ${r.EMPNME}`);
        });

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }

    console.log('\n========================================');
    console.log('检查完成');
    console.log('========================================');
}

main();
