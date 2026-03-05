/**
 * 深入检查销售 1 部的问题
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
    console.log('深入检查销售 1 部');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 检查 pb_dept 表中的销售 1 部
        console.log('【1】pb_dept 表中的销售 1 部：');
        const deptSql = `SELECT dptcde, dptnme FROM pb_dept WHERE dptnme = '销售 1 部'`;
        const deptResult = await conn.execute(deptSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   找到 ${deptResult.rows.length} 条记录：`);
        deptResult.rows.forEach(r => {
            console.log(`     ${r.DPTCDE} - ${r.DPTNME}`);
        });

        // 2. 检查 pb_dept_member 表，按部门分组统计
        console.log('\n【2】pb_dept_member 表按部门统计：');
        const memberStatsSql = `
            SELECT dptnme, COUNT(*) as cnt 
            FROM pb_dept_member 
            WHERE isactive = 'Y' 
            GROUP BY dptnme 
            ORDER BY cnt DESC
        `;
        const memberStatsResult = await conn.execute(memberStatsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log('   部门分布：');
        memberStatsResult.rows.slice(0, 30).forEach(r => {
            const deptName = r.DPTNME || '(NULL)';
            console.log(`     ${deptName}: ${r.CNT}人`);
        });

        // 3. 检查 HR_BASE 表中销售 1 部的业务员
        console.log('\n【3】HR_BASE 表中销售 1 部的业务员：');
        const hrBaseSql = `
            SELECT h.mobile, h.empnme, d.dptcde, d.dptnme
            FROM hr_base h
            JOIN pb_dept d ON h.dptcde = d.dptcde
            WHERE d.dptnme = '销售 1 部' AND h.status = 'Y'
            ORDER BY h.empnme
        `;
        const hrBaseResult = await conn.execute(hrBaseSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   找到 ${hrBaseResult.rows.length} 人：`);
        hrBaseResult.rows.forEach(r => {
            console.log(`     ${r.MOBILE} - ${r.EMPNME} - ${r.DPTNME}`);
        });

        // 4. 检查 3 月 4 号订单的 agntcde 是否能匹配到 HR_BASE
        console.log('\n【4】3 月 4 号订单的 agntcde 匹配 HR_BASE：');
        const matchSql = `
            SELECT t.agntcde, h.empnme, d.dptnme, COUNT(*) as cnt
            FROM ord_bas b
            JOIN ord_ct t ON b.serial = t.serial
            LEFT JOIN hr_base h ON t.agntcde = h.mobile
            LEFT JOIN pb_dept d ON h.dptcde = d.dptcde
            WHERE b.isactive = 'Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
            GROUP BY t.agntcde, h.empnme, d.dptnme
            ORDER BY cnt DESC
        `;
        const matchResult = await conn.execute(matchSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log('   前 20 条：');
        matchResult.rows.slice(0, 20).forEach(r => {
            console.log(`     ${r.AGNTCDE} | ${r.EMPNME || '无'} | ${r.DPTNME || '无'} | ${r.CNT}单`);
        });

        // 统计销售 1 部的订单
        const sales1Orders = matchResult.rows.filter(r => r.DPTNME === '销售 1 部');
        const sales1Total = sales1Orders.reduce((sum, r) => sum + r.CNT, 0);
        console.log(`\n   销售 1 部总单数：${sales1Total}单`);

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
