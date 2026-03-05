/**
 * 检查 pb_dept_member 表中的部门名称
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
    console.log('检查 pb_dept_member 表中的部门名称');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 查询所有不同的部门名称
        console.log('【1】所有不同的部门名称：');
        const deptSql = `SELECT DISTINCT dptnme FROM pb_dept_member WHERE isactive = 'Y' ORDER BY dptnme`;
        const deptResult = await conn.execute(deptSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   共 ${deptResult.rows.length} 个部门：`);
        deptResult.rows.slice(0, 30).forEach(r => {
            const deptName = r.DPTNME || '(NULL)';
            console.log(`     "${deptName}" (长度：${deptName.length})`);
        });

        // 检查包含"销售"的部门
        console.log('\n【2】包含"销售"的部门：');
        const salesDeptSql = `SELECT DISTINCT dptnme FROM pb_dept_member WHERE isactive = 'Y' AND dptnme LIKE '%销售%' ORDER BY dptnme`;
        const salesDeptResult = await conn.execute(salesDeptSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   共 ${salesDeptResult.rows.length} 个销售部门：`);
        salesDeptResult.rows.forEach(r => {
            const deptName = r.DPTNME || '(NULL)';
            console.log(`     "${deptName}"`);
        });

        // 检查销售 1 部的业务员
        console.log('\n【3】查询"销售 1 部"的业务员：');
        const sales1Sql = `
            SELECT empcde, empnme, dptnme 
            FROM pb_dept_member 
            WHERE isactive = 'Y' AND dptnme = '销售 1 部'
            ORDER BY empnme
        `;
        const sales1Result = await conn.execute(sales1Sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (sales1Result.rows.length > 0) {
            console.log(`   找到 ${sales1Result.rows.length} 名：`);
            sales1Result.rows.forEach(r => {
                console.log(`     ${r.EMPCDE} - ${r.EMPNME}`);
            });
        } else {
            console.log('   ⚠ 没有找到"销售 1 部"');
            
            // 尝试模糊匹配
            console.log('\n   尝试模糊匹配 "%销售 1%":');
            const fuzzySql = `
                SELECT empcde, empnme, dptnme 
                FROM pb_dept_member 
                WHERE isactive = 'Y' AND dptnme LIKE '%销售 1%'
                ORDER BY dptnme, empnme
            `;
            const fuzzyResult = await conn.execute(fuzzySql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            
            if (fuzzyResult.rows.length > 0) {
                console.log(`   找到 ${fuzzyResult.rows.length} 名：`);
                fuzzyResult.rows.forEach(r => {
                    console.log(`     ${r.EMPCDE} - ${r.EMPNME} - "${r.DPTNME}"`);
                });
            } else {
                console.log('   ⚠ 还是没有找到');
            }
        }

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
