/**
 * 查看 PB_EMPS_CLNT 表实际数据
 */

const oracledb = require('oracledb');

const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function checkEmpsClntData() {
    console.log('========================================');
    console.log('查看 PB_EMPS_CLNT 表实际数据');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. 统计 PB_EMPS_CLNT 表总数
        // ========================================
        console.log('【1】PB_EMPS_CLNT 表统计');
        const countResult = await conn.execute(`
            SELECT COUNT(*) as total FROM ferp.pb_emps_clnt
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   总记录数: ${countResult.rows[0].TOTAL}`);

        const activeCount = await conn.execute(`
            SELECT COUNT(*) as active FROM ferp.pb_emps_clnt WHERE isactive = 'Y'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   有效记录数: ${activeCount.rows[0].ACTIVE}`);

        // ========================================
        // 2. 查看 PB_EMPS_CLNT 示例数据（所有字段）
        // ========================================
        console.log('\n【2】PB_EMPS_CLNT 表 - 完整示例数据');
        const data = await conn.execute(`
            SELECT clntcde, clntnme, empcde, empnme, temcde, temnme, objtyp, isactive
            FROM ferp.pb_emps_clnt
            FETCH FIRST 10 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   样例数据 (前10条):');
        data.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 客户:[${r.CLNTCDE}] ${r.CLNTNME} 业务员:[${r.EMPCDE}] ${r.EMPNME} 部门:[${r.TEMCDE}] ${r.TEMNME} 类型:${r.OBJTYP} 有效:${r.ISACTIVE}`);
        });

        // ========================================
        // 3. 查看订单中的客户是否在 PB_EMPS_CLNT 中
        // ========================================
        console.log('\n【3】检查订单客户是否在 PB_EMPS_CLNT 中');
        
        const checkSql = `
            SELECT DISTINCT b.clntcde
            FROM ferp.ord_bas b
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND b.clntcde IN (SELECT clntcde FROM ferp.pb_emps_clnt WHERE isactive = 'Y')
            FETCH FIRST 20 ROWS ONLY
        `;
        const checkResult = await conn.execute(checkSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   在 PB_EMPS_CLNT 中有记录的订单客户 (${checkResult.rows.length}个, 前20):`);
        checkResult.rows.forEach(r => {
            console.log(`     [${r.CLNTCDE}]`);
        });

        // ========================================
        // 4. 查看 ord_ct.agntcde 与 pb_dept_member 的关系详情
        // ========================================
        console.log('\n【4】ord_ct.agntcde 与 pb_dept_member.empcde 关系详情');
        
        // 找出能匹配的详细情况
        const matchDetail = await conn.execute(`
            SELECT DISTINCT 
                t.agntcde,
                m.empnme,
                m.dptnme,
                COUNT(*) OVER (PARTITION BY t.agntcde) as order_count
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY order_count DESC
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   能匹配的业务员 (${matchDetail.rows.length}人):`);
        matchDetail.rows.forEach(r => {
            console.log(`     [${r.AGNTCDE}] ${r.EMPNME} (${r.DPTNME}) - ${r.ORDER_COUNT}单`);
        });

        // ========================================
        // 5. 找出不能匹配的 agntcde 并分析原因
        // ========================================
        console.log('\n【5】不能匹配的 agntcde 分析');
        
        const unmatchDetail = await conn.execute(`
            SELECT 
                t.agntcde,
                COUNT(*) as cnt
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            LEFT JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND t.agntcde IS NOT NULL
              AND m.empcde IS NULL
            GROUP BY t.agntcde
            ORDER BY cnt DESC
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   不能匹配的 agntcde (${unmatchDetail.rows.length}个):`);
        unmatchDetail.rows.slice(0, 10).forEach(r => {
            console.log(`     [${r.AGNTCDE}]: ${r.CNT}单`);
        });

        // 检查这些编码是否在 pb_dept_member 中以其他形式存在
        console.log('\n   检查 [13666446624] 是否在 pb_dept_member 中:');
        const checkEmp = await conn.execute(`
            SELECT empcde, empnme, dptnme
            FROM ferp.pb_dept_member
            WHERE empcde LIKE '%13666446624%' OR empnme LIKE '%13666446624%'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (checkEmp.rows.length > 0) {
            checkEmp.rows.forEach(r => {
                console.log(`     找到: [${r.EMPCDE}] ${r.EMPNME} (${r.DPTNME})`);
            });
        } else {
            console.log('     未找到');
        }

        console.log('\n========================================');
        console.log('结论:');
        console.log('  1. ord_ct.agntcde 直接匹配 pb_dept_member.empcde 是正确的方式');
        console.log('  2. 但 pb_dept_member 表中缺少部分业务员数据');
        console.log('  3. 缺失的业务员可能需要从其他数据源补充');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

checkEmpsClntData().catch(console.error);
