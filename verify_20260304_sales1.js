/**
 * 验证 2026-03-04 销售 1 部是否有数据
 */

const oracledb = require('oracledb');

const DB_CONFIG = {
    host: '36.134.7.141',
    port: 1521,
    service: 'dbms',
    user: 'ferp',
    password: 'kuke.b0003'
};

async function main() {
    console.log('========================================');
    console.log('验证 2026-03-04 销售 1 部数据');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });
        console.log('✓ 数据库连接成功（新厂新系统）\n');

        // 1. 先查销售 1 部的部门编码
        console.log('【1】查询销售 1 部的部门编码：');
        const deptSql = `SELECT dept_cde, dept_nme FROM pb_dept WHERE dept_nme LIKE '%销售 1 部%' OR dept_nme LIKE '%销售一部%'`;
        const deptResult = await conn.execute(deptSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        if (deptResult.rows.length > 0) {
            deptResult.rows.forEach(r => {
                console.log(`   部门编码：${r.DEPT_CDE}, 部门名称：${r.DEPT_NME}`);
            });
        } else {
            console.log('   ⚠ 未找到"销售 1 部"或"销售一部"');
            // 显示所有销售部门
            const allDepts = await conn.execute(`SELECT dept_cde, dept_nme FROM pb_dept WHERE dept_nme LIKE '%销售%'`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            console.log('   所有销售部门：');
            allDepts.rows.slice(0, 15).forEach(r => {
                console.log(`     ${r.DEPT_CDE} - ${r.DEPT_NME}`);
            });
        }

        // 2. 查询 3 月 4 号当天的所有订单数据
        console.log('\n【2】查询 2026-03-04 当天的订单数据：');
        const orderSql = `
            SELECT COUNT(*) as cnt, 
                   TO_CHAR(MIN(created), 'yyyy-MM-dd HH24:MI:SS') as min_time,
                   TO_CHAR(MAX(created), 'yyyy-MM-dd HH24:MI:SS') as max_time
            FROM ord_bas 
            WHERE isactive = 'Y' 
              AND created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND created < to_date('2026-03-05', 'yyyy-MM-dd')
        `;
        const orderResult = await conn.execute(orderSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        if (orderResult.rows.length > 0 && orderResult.rows[0].CNT > 0) {
            console.log(`   ✓ 3 月 4 号有 ${orderResult.rows[0].CNT} 条订单`);
            console.log(`   时间范围：${orderResult.rows[0].MIN_TIME} 到 ${orderResult.rows[0].MAX_TIME}`);
        } else {
            console.log('   ⚠ 3 月 4 号没有任何订单数据！');
        }

        // 3. 查询 3 月 4 号的数据，带业务员和部门关联
        console.log('\n【3】查询 3 月 4 号带业务员/部门的订单：');
        const detailSql = `
SELECT 
    b.serial as 单号，
    TO_CHAR(b.created, 'yyyy-MM-dd HH24:MI:SS') as 时间，
    b.prdnme as 产品，
    t.agntcde as 业务员编码，
    e.empnme as 业务员姓名，
    e.dept_cde as 部门编码，
    d.dept_nme as 部门名称
FROM ord_bas b
LEFT JOIN ord_ct t ON b.serial = t.serial
LEFT JOIN pb_dept_member e ON t.agntcde = e.mobile
LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y' 
  AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
  AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
ORDER BY b.created
        `;
        const detailResult = await conn.execute(detailSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   返回 ${detailResult.rows.length} 条记录`);
        if (detailResult.rows.length > 0) {
            console.log('   前 10 条详情：');
            detailResult.rows.slice(0, 10).forEach((r, i) => {
                console.log(`     ${i+1}. ${r.单号} | ${r.时间} | ${r.产品} | 业务员：${r.业务员姓名 || '无'}(${r.业务员编码}) | 部门：${r.部门名称 || '无'}(${r.部门编码})`);
            });

            // 统计各部门
            const deptStats = {};
            detailResult.rows.forEach(r => {
                const key = r.部门名称 || '无部门';
                deptStats[key] = (deptStats[key] || 0) + 1;
            });
            console.log('\n   各部门分布：');
            Object.entries(deptStats).forEach(([dept, count]) => {
                console.log(`     ${dept}: ${count}条`);
            });
        } else {
            console.log('   ⚠ 没有返回任何记录！');
        }

        // 4. 检查 ord_ct 表是否有 3 月 4 号的数据
        console.log('\n【4】检查 ord_ct 表 3 月 4 号的数据：');
        const ordCtSql = `
            SELECT COUNT(*) as cnt FROM ord_ct t
            INNER JOIN ord_bas b ON t.serial = b.serial
            WHERE b.isactive = 'Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
        `;
        const ordCtResult = await conn.execute(ordCtSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   ord_ct 表关联记录数：${ordCtResult.rows[0].CNT}`);

        // 5. 检查 pb_dept_member 表的销售 1 部成员
        console.log('\n【5】销售 1 部的业务员成员：');
        // 先找到销售 1 部的编码
        const deptCodeResult = await conn.execute(`SELECT dept_cde FROM pb_dept WHERE dept_nme LIKE '%销售 1 部%'`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        if (deptCodeResult.rows.length > 0) {
            const deptCde = deptCodeResult.rows[0].DEPT_CDE;
            const memberSql = `SELECT user_cde, user_nme, mobile, dept_cde FROM pb_dept_member WHERE dept_cde = :deptCde AND isactive = 'Y'`;
            const memberResult = await conn.execute(memberSql, [deptCde], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            console.log(`   销售 1 部有 ${memberResult.rows.length} 名成员：`);
            memberResult.rows.forEach(r => {
                console.log(`     ${r.USER_NME} (${r.MOBILE})`);
            });
        }

    } catch (err) {
        console.error('错误:', err);
    } finally {
        if (conn) await conn.close();
    }

    console.log('\n========================================');
    console.log('验证完成');
    console.log('========================================');
}

main();
