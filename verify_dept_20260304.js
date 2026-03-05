/**
 * 验证部门名称 - 检查 pb_dept 表中的销售部门
 */

const oracledb = require('oracledb');

// 使用老厂新系统（有 3 月 4 号数据）
const DB_CONFIG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function main() {
    console.log('========================================');
    console.log('验证销售部门名称（老厂新系统）');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });
        console.log('✓ 数据库连接成功\n');

        // 1. 先查 pb_dept 表结构
        console.log('【1】pb_dept 表结构：');
        const colsSql = `SELECT column_name FROM user_tab_columns WHERE table_name = 'PB_DEPT' ORDER BY column_id`;
        const colsResult = await conn.execute(colsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log('   字段：' + colsResult.rows.map(c => c.COLUMN_NAME).join(', '));

        // 2. 查询所有销售相关部门（使用正确字段名 DPTNME）
        console.log('\n【2】所有销售相关部门：');
        const deptSql = `SELECT DISTINCT dptcde, dptnme FROM pb_dept WHERE dptnme LIKE '%销售%' ORDER BY dptnme`;
        const deptResult = await conn.execute(deptSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (deptResult.rows.length > 0) {
            deptResult.rows.forEach(r => {
                console.log(`   ${r.DPTCDE} - ${r.DPTNME}`);
            });
        } else {
            console.log('   ⚠ 未找到销售部门');
        }

        // 3. 查询 pb_dept_member 中的部门
        console.log('\n【3】pb_dept_member 表结构：');
        const memberColsSql = `SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'PB_DEPT_MEMBER' ORDER BY column_id`;
        const memberColsResult = await conn.execute(memberColsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log('   字段：');
        memberColsResult.rows.forEach(c => {
            console.log(`     ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
        });

        // 4. 检查 3 月 4 号订单关联的业务员部门（使用 user_cde 关联）
        console.log('\n【4】3 月 4 号订单关联的业务员部门分布：');
        const orderDeptSql = `
            SELECT d.dptnme, COUNT(*) as cnt
            FROM ord_bas b
            JOIN ord_ct t ON b.serial = t.serial
            LEFT JOIN pb_dept_member e ON t.agntcde = e.user_cde
            LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
            WHERE b.isactive = 'Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
            GROUP BY d.dptnme
            ORDER BY cnt DESC
        `;
        const orderDeptResult = await conn.execute(orderDeptSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (orderDeptResult.rows.length > 0) {
            console.log('   部门分布：');
            orderDeptResult.rows.forEach(r => {
                console.log(`     ${r.DPTNME || '无部门'}: ${r.CNT}单`);
            });
        } else {
            console.log('   ⚠ 没有数据');
        }

        // 5. 专门检查销售 1 部的数据
        console.log('\n【5】销售 1 部（1010205008）3 月 4 号的数据：');
        const sales1Sql = `
            SELECT b.serial, b.prdnme, b.accamt, e.user_nme, d.dptnme
            FROM ord_bas b
            JOIN ord_ct t ON b.serial = t.serial
            LEFT JOIN pb_dept_member e ON t.agntcde = e.user_cde
            LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
            WHERE b.isactive = 'Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
              AND e.dept_cde = '1010205008'
            ORDER BY b.created
        `;
        const sales1Result = await conn.execute(sales1Sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (sales1Result.rows.length > 0) {
            console.log(`   ✓ 销售 1 部有 ${sales1Result.rows.length} 条记录：`);
            sales1Result.rows.slice(0, 10).forEach(r => {
                console.log(`     ${r.SERIAL} | ${r.PRDNME?.substring(0,20)} | ${r.ACCAMT} | ${r.USER_NME}`);
            });
        } else {
            console.log('   ⚠ 销售 1 部没有数据！');
        }

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }

    console.log('\n========================================');
    console.log('验证完成');
    console.log('========================================');
}

main();
