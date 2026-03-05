/**
 * 验证修复后的销售 1 部数据查询
 * 模拟修复后的代码逻辑：先查 pb_dept_member 表（新系统字段）
 */

const oracledb = require('oracledb');

const DB_CONFIG = {
    host: '36.138.132.30',  // 老厂新系统
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function main() {
    console.log('========================================');
    console.log('验证修复后的销售 1 部数据查询');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 模拟修复后的代码：查询新系统 pb_dept_member 表（使用正确字段 EMPCDE, EMPNME, DPTNME）
        console.log('【1】查询 pb_dept_member 表（新系统字段）：');
        const pbDeptMemberSql = `
            SELECT m.empcde as EMPCDE, m.empcde as EMPCDE2, 
                   m.empnme as EMPNME, m.dptnme as TEMNME
            FROM pb_dept_member m
            WHERE m.isactive = 'Y'
            ORDER BY m.dptnme, m.empnme
        `;
        const memberResult = await conn.execute(pbDeptMemberSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   共 ${memberResult.rows.length} 名业务员`);
        
        // 筛选销售 1 部
        const sales1Members = memberResult.rows.filter(r => r.TEMNME === '销售 1 部');
        console.log(`   销售 1 部：${sales1Members.length} 名业务员：`);
        sales1Members.forEach(r => {
            console.log(`     ${r.EMPCDE} - ${r.EMPNME}`);
        });

        // 2. 查询这些业务员 3 月 4 号的订单
        console.log('\n【2】销售 1 部 3 月 4 号的订单统计：');
        const sales1Codes = sales1Members.map(r => r.EMPCDE);
        
        if (sales1Codes.length > 0) {
            const orderSql = `
                SELECT t.agntcde, m.empnme, COUNT(*) as cnt, SUM(b.accamt) as total_amt
                FROM ord_bas b
                JOIN ord_ct t ON b.serial = t.serial
                LEFT JOIN pb_dept_member m ON t.agntcde = m.empcde
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
                console.log('   订单详情：');
                orderResult.rows.forEach(r => {
                    console.log(`     ${r.AGNTCDE} - ${r.EMPNME}: ${r.CNT}单，金额 ${r.TOTAL_AMT}`);
                    totalCnt += r.CNT;
                    totalAmt += parseFloat(r.TOTAL_AMT || 0);
                });
                console.log(`\n   合计：${totalCnt}单，总金额 ${totalAmt.toFixed(2)}元`);
            } else {
                console.log('   ⚠ 没有订单数据');
            }
        }

        // 3. 验证窗体_销售员图.cs 的查询逻辑（修复后）
        console.log('\n【3】测试窗体_销售员图.cs 的查询（带部门筛选）：');
        
        // 先获取所有业务员及其部门
        const allMembers = memberResult.rows;
        const deptDict = {};
        allMembers.forEach(m => {
            // 统一部门名称（模拟代码中的 Replace 逻辑）
            let deptName = m.TEMNME
                .replace('老厂销售', '销售')
                .replace('新厂销售', '销售')
                .replace('临海销售', '销售')
                .replace('温森一期销售', '销售')
                .replace('温森二期销售', '销售');
            
            if (!deptDict[deptName]) deptDict[deptName] = [];
            deptDict[deptName].push(m.EMPCDE);
        });

        // 获取销售 1 部的业务员编码
        const sales1CodesNormalized = deptDict['销售 1 部'] || [];
        console.log(`   销售 1 部业务员编码：${sales1CodesNormalized.join(', ')}`);

        // 查询销售 1 部的订单统计
        if (sales1CodesNormalized.length > 0) {
            const placeholders = sales1CodesNormalized.map(() => ':code').join(', ');
            const chartSql = `
                SELECT b.objtyp, t.agntcde, 
                       nvl(sum(b.accamt),0) as 金额，
                       count(*) as 单数
                FROM ord_bas b
                JOIN ord_ct t ON b.serial = t.serial
                WHERE b.isactive='Y'
                  AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
                  AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
                  AND t.agntcde IN (${placeholders})
                GROUP BY b.objtyp, t.agntcde
                ORDER BY 金额 DESC
            `;
            
            const params = sales1CodesNormalized;
            const chartResult = await conn.execute(chartSql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            
            if (chartResult.rows.length > 0) {
                let totalCnt = 0;
                let totalAmt = 0;
                console.log('   统计结果：');
                chartResult.rows.forEach(r => {
                    console.log(`     ${r.AGNTCDE} | ${r.OBJTYP} | ${r.单数}单 | ${r.金额}元`);
                    totalCnt += r.单数;
                    totalAmt += parseFloat(r.金额);
                });
                console.log(`\n   合计：${chartResult.rows.length}条记录，${totalCnt}单，${totalAmt.toFixed(2)}元`);
            } else {
                console.log('   ⚠ 没有数据');
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
