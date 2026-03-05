/**
 * 调试销售 1 部查询
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
    console.log('调试销售 1 部查询');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 直接查询所有业务员，检查部门名称
        console.log('【1】查询所有业务员（前 30 条）：');
        const allSql = `SELECT empcde, empnme, dptnme FROM pb_dept_member WHERE isactive = 'Y' AND ROWNUM <= 30 ORDER BY dptnme, empnme`;
        const allResult = await conn.execute(allSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        allResult.rows.forEach(r => {
            const deptName = r.DPTNME || '(NULL)';
            console.log(`   "${deptName}" (len=${deptName.length}) - ${r.EMPNME} (${r.EMPCDE})`);
        });

        // 2. 使用 LIKE 查询销售 1 部
        console.log('\n【2】使用 LIKE 查询 "%销售 1 部%"：');
        const likeSql = `SELECT empcde, empnme, dptnme FROM pb_dept_member WHERE isactive = 'Y' AND dptnme LIKE '%销售 1 部%'`;
        const likeResult = await conn.execute(likeSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   找到 ${likeResult.rows.length} 人：`);
        likeResult.rows.forEach(r => {
            console.log(`     "${r.DPTNME}" - ${r.EMPNME} (${r.EMPCDE})`);
        });

        // 3. 检查是否有空格或特殊字符
        console.log('\n【3】检查部门名称的字节：');
        const checkSql = `SELECT dptnme, DUMP(dptnme) as dump_info FROM pb_dept_member WHERE isactive = 'Y' AND dptnme LIKE '%销售 1%' AND ROWNUM <= 5`;
        const checkResult = await conn.execute(checkSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        checkResult.rows.forEach(r => {
            console.log(`   "${r.DPTNME}" - ${r.DUMP_INFO}`);
        });

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }

    console.log('\n========================================');
    console.log('调试完成');
    console.log('========================================');
}

main();
