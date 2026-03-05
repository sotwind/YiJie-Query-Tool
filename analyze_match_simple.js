/**
 * 详细分析订单表和业务员表的匹配问题 - 简化版
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
            SELECT column_name, data_type, data_length
            FROM all_tab_columns
            WHERE table_name = 'ORD_CT' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        ordCtCols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
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
            console.log(`   ${i+1}. 单号:${r.SERIAL} agntcde:[${r.AGNTCDE}]`);
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
            SELECT column_name, data_type, data_length
            FROM all_tab_columns
            WHERE table_name = 'PB_DEPT_MEMBER' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        memberCols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
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
            console.log(`   ${i+1}. empcde:[${r.EMPCDE}] 姓名:${r.EMPNME} 部门:${r.DPTNME}`);
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
        // 7. 尝试 hr_base 表匹配
        // ========================================
        console.log('\n【7】尝试 hr_base 表匹配');
        
        // 查看 hr_base 结构
        console.log('   hr_base 表结构:');
        const hrBaseCols = await conn.execute(`
            SELECT column_name, data_type
            FROM all_tab_columns
            WHERE table_name = 'HR_BASE' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        hrBaseCols.rows.slice(0, 15).forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
        });

        // 尝试 mobile 匹配
        const matchMobile = await conn.execute(`
            SELECT COUNT(*) as cnt
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            JOIN ferp.hr_base h ON t.agntcde = h.mobile
            WHERE b.isactive = 'Y'
              AND h.status = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`\n   t.agntcde = h.mobile 匹配: ${matchMobile.rows[0].CNT}单`);

        // 能匹配的 hr_base 记录
        const hrMatchDetail = await conn.execute(`
            SELECT DISTINCT t.agntcde, h.empnme, d.dptnme
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            JOIN ferp.hr_base h ON t.agntcde = h.mobile
            JOIN ferp.pb_dept d ON h.dptcde = d.dptcde
            WHERE b.isactive = 'Y'
              AND h.status = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY d.dptnme
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   能匹配的业务员 (${hrMatchDetail.rows.length}人, 前20):`);
        hrMatchDetail.rows.forEach(r => {
            console.log(`     [${r.AGNTCDE}] -> ${r.EMPNME} (${r.DPTNME})`);
        });

        // ========================================
        // 8. 组合匹配方案
        // ========================================
        console.log('\n【8】组合匹配方案 (pb_dept_member + hr_base)');
        
        const combinedSql = `
            SELECT 
                TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
                b.serial as 单号，
                c.clntnme as 客户，
                b.prdnme as 产品，
                COALESCE(m.empnme, h.empnme) as 业务员，
                COALESCE(m.dptnme, d.dptnme) as 部门，
                nvl(b.accamt, 0) as 卖价总金额
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            LEFT JOIN ferp.hr_base h ON t.agntcde = h.mobile AND h.status = 'Y'
            LEFT JOIN ferp.pb_dept d ON h.dptcde = d.dptcde
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND (m.empcde IS NOT NULL OR h.mobile IS NOT NULL)
            ORDER BY b.created
            FETCH FIRST 10 ROWS ONLY
        `;
        
        const combinedResult = await conn.execute(combinedSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   组合匹配返回 ${combinedResult.rows.length} 条记录:`);
        combinedResult.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 单号:${r.单号} 业务员:${r.业务员 || '(空)'} 部门:${r.部门 || '(空)'}`);
        });

        // 统计组合匹配的总数
        const combinedCount = await conn.execute(`
            SELECT COUNT(*) as cnt
            FROM ferp.ord_bas b
            LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            LEFT JOIN ferp.hr_base h ON t.agntcde = h.mobile AND h.status = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND (m.empcde IS NOT NULL OR h.mobile IS NOT NULL)
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`\n   组合匹配总计: ${combinedCount.rows[0].CNT}单`);

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
