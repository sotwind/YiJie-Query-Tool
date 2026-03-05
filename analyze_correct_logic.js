/**
 * 按照正确的业务逻辑分析：
 * ord_ct -> pb_clnt -> 业务员 -> pb_dept_member
 */

const oracledb = require('oracledb');

const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function analyzeCorrectLogic() {
    console.log('========================================');
    console.log('按照正确业务逻辑分析匹配关系');
    console.log('ord_ct -> pb_clnt -> 业务员 -> pb_dept_member');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. 查看 pb_clnt 表结构（客户表）
        // ========================================
        console.log('【1】pb_clnt 客户表结构');
        const clntCols = await conn.execute(`
            SELECT column_name, data_type
            FROM all_tab_columns
            WHERE table_name = 'PB_CLNT' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        clntCols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
        });

        // ========================================
        // 2. 查看 pb_clnt 示例数据，重点看业务员字段
        // ========================================
        console.log('\n【2】pb_clnt 表 - 示例数据（重点看业务员字段）');
        const clntData = await conn.execute(`
            SELECT clntcde, clntnme, agntcde, asscde, dptcde
            FROM ferp.pb_clnt
            WHERE isactive = 'Y'
              AND agntcde IS NOT NULL
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   样例数据 (前20条):');
        clntData.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 客户:${r.CLNTCDE} 名称:${r.CLNTNME} 业务员:[${r.AGNTCDE}] 跟单员:[${r.ASSCDE}]`);
        });

        // ========================================
        // 3. 测试正确逻辑：ord_ct -> pb_clnt -> pb_dept_member
        // ========================================
        console.log('\n【3】测试正确逻辑：ord_ct -> pb_clnt -> pb_dept_member');
        
        const correctSql = `
            SELECT 
                b.serial as 单号，
                t.clntcde as 客户编码，
                c.clntnme as 客户名称，
                c.agntcde as 客户表业务员编码，
                m.empnme as 业务员姓名，
                m.dptnme as 部门名称
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_clnt c ON t.clntcde = c.clntcde
            LEFT JOIN ferp.pb_dept_member m ON c.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY b.created
            FETCH FIRST 20 ROWS ONLY
        `;
        
        const correctResult = await conn.execute(correctSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   返回 ${correctResult.rows.length} 条记录:`);
        correctResult.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 单号:${r.单号} 客户:${r.客户名称} 业务员编码:[${r.客户表业务员编码}] 业务员:${r.业务员姓名 || '(空)'} 部门:${r.部门名称 || '(空)'}`);
        });

        // ========================================
        // 4. 统计正确逻辑的匹配率
        // ========================================
        console.log('\n【4】统计正确逻辑的匹配率');
        
        const statsSql = `
            SELECT 
                COUNT(*) as 总单数，
                COUNT(c.agntcde) as 有客户业务员的单数，
                COUNT(m.empcde) as 能匹配到pb_dept_member的单数
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_clnt c ON t.clntcde = c.clntcde
            LEFT JOIN ferp.pb_dept_member m ON c.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `;
        
        const statsResult = await conn.execute(statsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const s = statsResult.rows[0];
        console.log(`   总单数: ${s.总单数}`);
        console.log(`   有客户业务员的单数: ${s.有客户业务员的单数}`);
        console.log(`   能匹配到pb_dept_member的单数: ${s.能匹配到pb_dept_member的单数}`);
        console.log(`   匹配率: ${(s.能匹配到pb_dept_member的单数 / s.总单数 * 100).toFixed(1)}%`);

        // ========================================
        // 5. 对比两种逻辑的差异
        // ========================================
        console.log('\n【5】对比两种逻辑的差异');
        
        // 旧逻辑：直接用 ord_ct.agntcde
        const oldLogicSql = `
            SELECT COUNT(DISTINCT t.agntcde) as 不同agntcde数量
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND t.agntcde IS NOT NULL
        `;
        const oldLogicResult = await conn.execute(oldLogicSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   旧逻辑(ord_ct.agntcde): ${oldLogicResult.rows[0].不同AGNTCDE数量} 个不同的agntcde`);
        
        // 新逻辑：用 pb_clnt.agntcde
        const newLogicSql = `
            SELECT COUNT(DISTINCT c.agntcde) as 不同业务员数量
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_clnt c ON t.clntcde = c.clntcde
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND c.agntcde IS NOT NULL
        `;
        const newLogicResult = await conn.execute(newLogicSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   新逻辑(pb_clnt.agntcde): ${newLogicResult.rows[0].不同业务员数量} 个不同的业务员`);

        // ========================================
        // 6. 查看哪些订单的客户没有业务员信息
        // ========================================
        console.log('\n【6】查看客户表中没有业务员信息的订单');
        
        const noAgntcdeSql = `
            SELECT b.serial, t.clntcde, c.clntnme, c.agntcde
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_clnt c ON t.clntcde = c.clntcde
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND (c.agntcde IS NULL OR c.agntcde = '')
            FETCH FIRST 10 ROWS ONLY
        `;
        const noAgntcdeResult = await conn.execute(noAgntcdeSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   无业务员信息的订单 (${noAgntcdeResult.rows.length}条, 前10):`);
        noAgntcdeResult.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 单号:${r.SERIAL} 客户:${r.CLNTNME} 客户编码:${r.CLNTCDE} 业务员:[${r.AGNTCDE}]`);
        });

        // ========================================
        // 7. 最终正确的SQL
        // ========================================
        console.log('\n【7】最终正确的SQL（用于利润统计）');
        console.log(`
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    m.empnme as 业务员，
    m.dptnme as 部门，
    nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 报价总金额，
    nvl(b.accamt, 0) as 卖价总金额，
    nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 利润差额，
    case 
        when nvl(b.quoprc, 0) * nvl(b.accnum, 0) = 0 then 0
        else (nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) 
             / (nvl(b.quoprc, 0) * nvl(b.accnum, 0)) * 100
    end as 利率
FROM ord_bas b
LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ord_ct t ON b.serial = t.serial
LEFT JOIN pb_dept_member m ON c.agntcde = m.empcde AND m.isactive = 'Y'
WHERE b.isactive = 'Y'
  AND b.created >= to_date('...', 'yyyy-MM-dd')
  AND b.created < to_date('...', 'yyyy-MM-dd')
        `);

        console.log('\n========================================');
        console.log('关键修改点:');
        console.log('  1. 从 pb_clnt 表获取业务员: c.agntcde');
        console.log('  2. 用 c.agntcde 关联 pb_dept_member: m.empcde');
        console.log('  3. 不再直接使用 ord_ct.agntcde');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

analyzeCorrectLogic().catch(console.error);
