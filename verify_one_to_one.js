/**
 * 验证 pb_clnt_atta 是否是一对一关系
 */

const oracledb = require('oracledb');

const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function verifyOneToOne() {
    console.log('========================================');
    console.log('验证 pb_clnt_atta 是否是一对一关系');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. 检查一个客户是否有多个业务员
        // ========================================
        console.log('【1】检查一个客户是否有多个业务员记录');
        
        const multiEmpCheck = await conn.execute(`
            SELECT clntcde, COUNT(*) as cnt
            FROM ferp.pb_clnt_atta
            WHERE isactive = 'Y'
            GROUP BY clntcde
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (multiEmpCheck.rows.length > 0) {
            console.log(`   发现 ${multiEmpCheck.rows.length} 个客户有多个业务员记录:`);
            multiEmpCheck.rows.forEach(r => {
                console.log(`     客户 [${r.CLNTCDE}]: ${r.CNT} 条记录`);
            });
        } else {
            console.log('   ✓ 所有客户都只有一条记录（一对一关系）');
        }

        // ========================================
        // 2. 统计总记录数和客户数
        // ========================================
        console.log('\n【2】统计 pb_clnt_atta 记录数');
        
        const totalStats = await conn.execute(`
            SELECT 
                COUNT(*) as 总记录数,
                COUNT(DISTINCT clntcde) as 不同客户数
            FROM ferp.pb_clnt_atta
            WHERE isactive = 'Y'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        const s = totalStats.rows[0];
        console.log(`   总记录数: ${s.总记录数}`);
        console.log(`   不同客户数: ${s.不同客户数}`);
        console.log(`   关系: ${s.总记录数 == s.不同客户数 ? '✓ 一对一' : '✗ 一对多'}`);

        // ========================================
        // 3. 查看订单客户的业务员分布
        // ========================================
        console.log('\n【3】2026-03-04 订单的客户业务员分布');
        
        const orderEmpDist = await conn.execute(`
            SELECT 
                ca.agntcde,
                m.empnme,
                m.dptnme,
                COUNT(*) as 订单数
            FROM ferp.ord_bas b
            JOIN ferp.pb_clnt_atta ca ON b.clntcde = ca.clntcde AND ca.isactive = 'Y'
            LEFT JOIN ferp.pb_dept_member m ON ca.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            GROUP BY ca.agntcde, m.empnme, m.dptnme
            ORDER BY 订单数 DESC
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   共 ${orderEmpDist.rows.length} 名业务员有订单:`);
        orderEmpDist.rows.slice(0, 15).forEach(r => {
            console.log(`     [${r.AGNTCDE}] ${r.EMPNME || '?'} (${r.DPTNME || '?'}): ${r.订单数}单`);
        });

        // ========================================
        // 4. 对比两种方式的差异详情
        // ========================================
        console.log('\n【4】对比 ord_ct.agntcde 和 pb_clnt_atta.agntcde 的差异');
        
        // 找出 ord_ct 中有但 pb_clnt_atta 中没有的
        const diffSql = `
            SELECT DISTINCT t.agntcde
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND t.agntcde IS NOT NULL
              AND t.agntcde NOT IN (
                  SELECT DISTINCT ca.agntcde 
                  FROM ferp.pb_clnt_atta ca 
                  WHERE ca.isactive = 'Y'
              )
            FETCH FIRST 10 ROWS ONLY
        `;
        
        const diffResult = await conn.execute(diffSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (diffResult.rows.length > 0) {
            console.log(`   ord_ct 中有但 pb_clnt_atta 中没有的业务员 (${diffResult.rows.length}个):`);
            diffResult.rows.forEach(r => {
                console.log(`     [${r.AGNTCDE}]`);
            });
        } else {
            console.log('   ✓ ord_ct.agntcde 都在 pb_clnt_atta 中存在');
        }

        // ========================================
        // 5. 最终确认：使用 pb_clnt_atta 的正确SQL
        // ========================================
        console.log('\n【5】使用 pb_clnt_atta 的最终SQL测试');
        
        const finalSql = `
            SELECT 
                TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
                b.serial as 单号，
                c.clntnme as 客户，
                b.prdnme as 产品，
                ca.agntcde as 业务员编码，
                m.empnme as 业务员姓名，
                m.dptnme as 部门名称，
                nvl(b.accamt, 0) as 卖价总金额
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN ferp.pb_clnt_atta ca ON b.clntcde = ca.clntcde AND ca.isactive = 'Y'
            LEFT JOIN ferp.pb_dept_member m ON ca.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY b.created
            FETCH FIRST 10 ROWS ONLY
        `;
        
        const finalResult = await conn.execute(finalSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   返回 ${finalResult.rows.length} 条记录:`);
        finalResult.rows.forEach((r, i) => {
            const status = r.业务员姓名 ? '✓' : '✗';
            console.log(`   ${status} ${i+1}. 单号:${r.单号} 业务员:[${r.业务员编码}] ${r.业务员姓名 || '(空)'} ${r.部门名称 || ''}`);
        });

        // 统计总数
        const finalCount = await conn.execute(`
            SELECT COUNT(*) as cnt
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt_atta ca ON b.clntcde = ca.clntcde AND ca.isactive = 'Y'
            LEFT JOIN ferp.pb_dept_member m ON ca.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`\n   总计: ${finalCount.rows[0].CNT} 单`);

        console.log('\n========================================');
        console.log('结论:');
        console.log('  pb_clnt_atta 是一对一关系');
        console.log('  应该使用 pb_clnt_atta 方式关联业务员');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

verifyOneToOne().catch(console.error);
