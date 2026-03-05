/**
 * 正确统计销售 1 部 3 月 4 号的订单
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
    console.log('正确统计销售 1 部 3 月 4 号的订单');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 从 pb_dept_member 获取销售 1 部的业务员
        console.log('【1】销售 1 部的业务员（来自 pb_dept_member）：');
        const memberSql = `
            SELECT empcde, empnme, dptnme 
            FROM pb_dept_member 
            WHERE isactive = 'Y' AND dptnme = '销售 1 部'
            ORDER BY empnme
        `;
        const memberResult = await conn.execute(memberSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   共 ${memberResult.rows.length} 人：`);
        const sales1Codes = [];
        memberResult.rows.forEach(r => {
            console.log(`     ${r.EMPCDE} - ${r.EMPNME}`);
            sales1Codes.push(r.EMPCDE);
        });

        // 2. 统计这些业务员 3 月 4 号的订单
        console.log('\n【2】销售 1 部 3 月 4 号订单统计：');
        if (sales1Codes.length > 0) {
            const placeholders = sales1Codes.map(() => ':code').join(', ');
            const orderSql = `
                SELECT t.agntcde, COUNT(*) as cnt, SUM(b.accamt) as total_amt
                FROM ord_bas b
                JOIN ord_ct t ON b.serial = t.serial
                WHERE b.isactive = 'Y'
                  AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
                  AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
                  AND t.agntcde IN (${placeholders})
                GROUP BY t.agntcde
                ORDER BY cnt DESC
            `;
            const orderResult = await conn.execute(orderSql, sales1Codes, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            
            if (orderResult.rows.length > 0) {
                let totalCnt = 0;
                let totalAmt = 0;
                console.log('   订单详情：');
                orderResult.rows.forEach(r => {
                    console.log(`     ${r.AGNTCDE}: ${r.CNT}单，金额 ${r.TOTAL_AMT}`);
                    totalCnt += r.CNT;
                    totalAmt += parseFloat(r.TOTAL_AMT || 0);
                });
                console.log(`\n   ✅ 合计：${orderResult.rows.length}名业务员，${totalCnt}单，总金额 ${totalAmt.toFixed(2)}元`);
            } else {
                console.log('   ⚠ 没有订单数据');
            }
        }

        // 3. 测试窗体_销售员图.cs 的 SQL（修复后应该能查到）
        console.log('\n【3】测试窗体_销售员图.cs 的 SQL（模拟修复后逻辑）：');
        const chartSql = `
            SELECT b.objtyp, t.agntcde, m.empnme, m.dptnme,
                   nvl(sum(b.accamt),0) as 金额，
                   count(*) as 单数
            FROM ord_bas b
            JOIN ord_ct t ON b.serial = t.serial
            LEFT JOIN pb_dept_member m ON t.agntcde = m.empcde
            WHERE b.isactive='Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
              AND m.dptnme = '销售 1 部'
            GROUP BY b.objtyp, t.agntcde, m.empnme, m.dptnme
            ORDER BY 金额 DESC
        `;
        const chartResult = await conn.execute(chartSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (chartResult.rows.length > 0) {
            let totalCnt = 0;
            let totalAmt = 0;
            console.log('   查询结果：');
            chartResult.rows.forEach(r => {
                console.log(`     ${r.AGNTCDE} - ${r.EMPNME} | ${r.DPTNME} | ${r.OBJTYP} | ${r.单数}单 | ${r.金额}元`);
                totalCnt += r.单数;
                totalAmt += parseFloat(r.金额);
            });
            console.log(`\n   ✅ 合计：${chartResult.rows.length}条记录，${totalCnt}单，${totalAmt.toFixed(2)}元`);
        } else {
            console.log('   ⚠ 没有数据');
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
