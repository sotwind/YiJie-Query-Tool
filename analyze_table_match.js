/**
 * 详细分析订单表和业务员表的匹配问题
 */

const oracledb = require('oracledb');

const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function analyzeTables() {
    console.log('========================================');
    console.log('详细分析表结构和数据匹配问题');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. ord_ct 表结构
        // ========================================
        console.log('【1】ord_ct 表结构');
        const ordCtCols = await conn.execute(`
            SELECT column_name, data_type, data_length, nullable
            FROM all_tab_columns
            WHERE table_name = 'ORD_CT' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        ordCtCols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE}${r.DATA_LENGTH ? '('+r.DATA_LENGTH+')' : ''})`);
        });

        // ========================================
        // 2. ord_ct 示例数据（重点看 agntcde）
        // ========================================
        console.log('\n【2】ord_ct 表 - 2026-03-04 的 agntcde 示例数据');
        const ordCtData = await conn.execute(`
            SELECT serial, agntcde, asscde, created
            FROM ferp.ord_ct
            WHERE isactive = 'Y'
              AND created >= DATE '2026-03-04'
              AND created < DATE '2026-03-05'
              AND agntcde IS NOT NULL
            ORDER BY created
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   样例数据 (前20条):');
        ordCtData.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 单号:${r.SERIAL} agntcde:[${r.AGNTCDE}] asscde:[${r.ASSCDE}]`);
        });

        // ========================================
        // 3. agntcde 统计分布
        // ========================================
        console.log('\n【3】agntcde 分布统计（前20名）');
        const agntcdeStats = await conn.execute(`
            SELECT agntcde, COUNT(*) as cnt
            FROM ferp.ord_ct
            WHERE isactive = 'Y'
              AND created >= DATE '2026-03-04'
              AND created < DATE '2026-03-05'
              AND agntcde IS NOT NULL
            GROUP BY agntcde
            ORDER BY cnt DESC
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        agntcdeStats.rows.forEach(r => {
            console.log(`   [${r.AGNTCDE}]: ${r.CNT}单`);
        });

        // ========================================
        // 4. pb_dept_member 表结构
        // ========================================
        console.log('\n【4】pb_dept_member 表结构');
        const memberCols = await conn.execute(`
            SELECT column_name, data_type, data_length, nullable
            FROM all_tab_columns
            WHERE table_name = 'PB_DEPT_MEMBER' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        memberCols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE}${r.DATA_LENGTH ? '('+r.DATA_LENGTH+')' : ''})`);
        });

        // ========================================
        // 5. pb_dept_member 示例数据
        // ========================================
        console.log('\n【5】pb_dept_member 表 - 示例数据');
        const memberData = await conn.execute(`
            SELECT empcde, empnme, dptnme, isactive
            FROM ferp.pb_dept_member
            WHERE isactive = 'Y'
            ORDER BY dptnme, empnme
            FETCH FIRST 30 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   样例数据 (前30条):');
        memberData.rows.forEach((r, i) => {
            console.log(`   ${i+1}. empcde:[${r.EMPCDE}] user_cde:[${r.USER_CDE}] 姓名:${r.EMPNME} 部门:${r.DPTNME} mobile:[${r.MOBILE}]`);
        });

        // ========================================
        // 6. 当前匹配逻辑的问题分析
        // ========================================
        console.log('\n【6】当前匹配逻辑分析 (t.agntcde = m.empcde)');
        
        // 找出能匹配的
        const matchedData = await conn.execute(`
            SELECT DISTINCT t.agntcde, m.empcde, m.empnme, m.dptnme
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde
            WHERE b.isactive = 'Y'
              AND m.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY m.dptnme
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   能匹配的业务员 (${matchedData.rows.length}人):`);
        matchedData.rows.forEach(r => {
            console.log(`     [${r.AGNTCDE}] -> ${r.EMPNME} (${r.DPTNME})`);
        });

        // 找出不能匹配的 agntcde
        const unmatchedData = await conn.execute(`
            SELECT DISTINCT t.agntcde, COUNT(*) as cnt
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
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`\n   不能匹配的 agntcde (${unmatchedData.rows.length}个, 前20):`);
        unmatchedData.rows.forEach(r => {
            console.log(`     [${r.AGNTCDE}]: ${r.CNT}单`);
        });

        // ========================================
        // 7. 尝试其他匹配方式
        // ========================================
        console.log('\n【7】尝试其他匹配方式');
        
        // 尝试 user_cde
        const matchUserCde = await conn.execute(`
            SELECT COUNT(*) as cnt
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            JOIN ferp.pb_dept_member m ON t.agntcde = m.user_cde
            WHERE b.isactive = 'Y'
              AND m.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   t.agntcde = m.user_cde 匹配: ${matchUserCde.rows[0].CNT}单`);

        // 尝试 mobile
        const matchMobile = await conn.execute(`
            SELECT COUNT(*) as cnt
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            JOIN ferp.pb_dept_member m ON t.agntcde = m.mobile
            WHERE b.isactive = 'Y'
              AND m.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   t.agntcde = m.mobile 匹配: ${matchMobile.rows[0].CNT}单`);

        // 尝试 phone
        const matchPhone = await conn.execute(`
            SELECT COUNT(*) as cnt
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            JOIN ferp.pb_dept_member m ON t.agntcde = m.phone
            WHERE b.isactive = 'Y'
              AND m.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   t.agntcde = m.phone 匹配: ${matchPhone.rows[0].CNT}单`);

        // 尝试 hr_base
        console.log('\n【8】尝试 hr_base 表匹配');
        const matchHrBase = await conn.execute(`
            SELECT COUNT(*) as cnt
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            JOIN ferp.hr_base h ON t.agntcde = h.mobile
            WHERE b.isactive = 'Y'
              AND h.status = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   t.agntcde = h.mobile 匹配: ${matchHrBase.rows[0].CNT}单`);

        // 查看 hr_base 结构
        console.log('\n   hr_base 表结构:');
        const hrBaseCols = await conn.execute(`
            SELECT column_name, data_type, data_length
            FROM all_tab_columns
            WHERE table_name = 'HR_BASE' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        hrBaseCols.rows.slice(0, 15).forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
        });

        // ========================================
        // 9. 组合匹配方案
        // ========================================
        console.log('\n【9】组合匹配方案测试 (COALESCE)');
        const combinedMatch = await conn.execute(`
            SELECT COUNT(*) as cnt
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            LEFT JOIN ferp.pb_dept_member m ON t.agntcde IN (m.empcde, m.user_cde, m.mobile)
            WHERE b.isactive = 'Y'
              AND m.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   组合匹配 (empcde/user_cde/mobile): ${combinedMatch.rows[0].CNT}单`);

        console.log('\n========================================');
        console.log('分析完成');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

analyzeTables().catch(console.error);
