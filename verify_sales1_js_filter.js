/**
 * 在 JavaScript 中过滤销售 1 部
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
    console.log('在 JavaScript 中过滤销售 1 部');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 获取所有业务员（不在 SQL 中过滤）
        console.log('【1】获取所有业务员：');
        const allSql = `SELECT empcde, empnme, dptnme FROM pb_dept_member WHERE isactive = 'Y'`;
        const allResult = await conn.execute(allSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   共 ${allResult.rows.length} 名业务员`);

        // 在 JavaScript 中过滤
        const sales1Members = allResult.rows.filter(r => r.DPTNME === '销售 1 部');
        console.log(`   销售 1 部：${sales1Members.length} 人：`);
        sales1Members.forEach(r => {
            console.log(`     ${r.EMPCDE} - ${r.EMPNME}`);
        });

        // 2. 统计销售 1 部 3 月 4 号的订单
        console.log('\n【2】销售 1 部 3 月 4 号订单：');
        if (sales1Members.length > 0) {
            const codes = sales1Members.map(r => r.EMPCDE);
            const placeholders = codes.map(() => ':c' + codes.indexOf(r)).join(', ');
            const params = {};
            codes.forEach((code, i) => { params['c' + i] = code; });
            
            // 重新构建 placeholders
            const ph = codes.map((_, i) => ':c' + i).join(', ');
            
            const orderSql = `
                SELECT t.agntcde, COUNT(*) as cnt, SUM(b.accamt) as total_amt
                FROM ord_bas b
                JOIN ord_ct t ON b.serial = t.serial
                WHERE b.isactive = 'Y'
                  AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
                  AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
                  AND t.agntcde IN (${ph})
                GROUP BY t.agntcde
                ORDER BY cnt DESC
            `;
            
            const orderResult = await conn.execute(orderSql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            
            if (orderResult.rows.length > 0) {
                let totalCnt = 0;
                let totalAmt = 0;
                console.log('   订单详情：');
                orderResult.rows.forEach(r => {
                    console.log(`     ${r.AGNTCDE}: ${r.CNT}单，金额 ${r.TOTAL_AMT}`);
                    totalCnt += r.CNT;
                    totalAmt += parseFloat(r.TOTAL_AMT || 0);
                });
                console.log(`\n   ✅ 合计：${totalCnt}单，总金额 ${totalAmt.toFixed(2)}元`);
            } else {
                console.log('   ⚠ 没有订单数据');
            }
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
