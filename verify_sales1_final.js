/**
 * 验证销售 1 部 3 月 4 号的数据（使用正确的字段名）
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
    console.log('验证销售 1 部 3 月 4 号数据');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 销售 1 部的业务员列表
        console.log('【1】销售 1 部的业务员：');
        const sales1EmpsSql = `
            SELECT empcde, empnme, dptnme 
            FROM FERP.PB_DEPT_MEMBER 
            WHERE dptnme = '销售 1 部' AND isactive = 'Y'
            ORDER BY empnme
        `;
        const sales1EmpsResult = await conn.execute(sales1EmpsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        const sales1EmpCodes = sales1EmpsResult.rows.map(r => r.EMPCDE);
        console.log(`   共 ${sales1EmpsResult.rows.length} 名业务员：`);
        sales1EmpsResult.rows.forEach(r => {
            console.log(`     ${r.EMPCDE} - ${r.EMPNME}`);
        });

        // 2. 查询这些业务员 3 月 4 号的订单
        console.log('\n【2】销售 1 部业务员 3 月 4 号的订单：');
        const orderSql = `
            SELECT t.agntcde, m.empnme, COUNT(*) as cnt, SUM(b.accamt) as total_amt
            FROM ord_bas b
            JOIN ord_ct t ON b.serial = t.serial
            LEFT JOIN FERP.PB_DEPT_MEMBER m ON t.agntcde = m.empcde
            WHERE b.isactive = 'Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
              AND m.dptnme = '销售 1 部'
            GROUP BY t.agntcde, m.empnme
            ORDER BY cnt DESC
        `;
        const orderResult = await conn.execute(orderSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (orderResult.rows.length > 0) {
            let totalCnt = 0;
            let totalAmt = 0;
            console.log('   订单统计：');
            orderResult.rows.forEach(r => {
                console.log(`     ${r.AGNTCDE} - ${r.EMPNME}: ${r.CNT}单, 金额 ${r.TOTAL_AMT}`);
                totalCnt += r.CNT;
                totalAmt += r.TOTAL_AMT;
            });
            console.log(`\n   合计：${totalCnt}单, 总金额 ${totalAmt.toFixed(2)}元`);
        } else {
            console.log('   ⚠ 没有数据！');
        }

        // 3. 测试窗体_销售员图.cs 中的 SQL 逻辑
        console.log('\n【3】测试窗体_销售员图.cs 的 SQL（按业务员统计）：');
        const chartSql = `
            SELECT b.objtyp, t.agntcde, 
                   nvl(sum(b.accamt),0) as 金额，
                   nvl(sum(t.acreage * nvl(t.ordnum,0)),0) as 面积，
                   count(*) as 单数
            FROM ord_bas b
            JOIN ord_ct t ON b.serial = t.serial
            WHERE b.isactive='Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
            GROUP BY b.objtyp, t.agntcde
            ORDER BY 金额 DESC
        `;
        const chartResult = await conn.execute(chartSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (chartResult.rows.length > 0) {
            console.log(`   共 ${chartResult.rows.length} 条记录`);
            console.log('   前 10 条：');
            chartResult.rows.slice(0, 10).forEach(r => {
                // 查找这个业务员是否属于销售 1 部
                const emp = sales1EmpsResult.rows.find(e => e.EMPCDE === r.AGNTCDE);
                const dept = emp ? emp.DPTNME : '未知';
                console.log(`     ${r.AGNTCDE} | ${emp?.EMPNME || '未知'} | ${dept} | ${r.OBJTYP} | ${r.单数}单 | ${r.金额}元`);
            });

            // 统计销售 1 部的记录
            const sales1Records = chartResult.rows.filter(r => sales1EmpCodes.includes(r.AGNTCDE));
            const sales1Total = sales1Records.reduce((sum, r) => sum + r.单数, 0);
            const sales1Amount = sales1Records.reduce((sum, r) => sum + parseFloat(r.金额), 0);
            console.log(`\n   销售 1 部合计：${sales1Records.length}条记录，${sales1Total}单，${sales1Amount.toFixed(2)}元`);
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
