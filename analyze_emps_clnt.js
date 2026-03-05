/**
 * 分析 PB_EMPS_CLNT 中间表
 */

const oracledb = require('oracledb');

const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function analyzeEmpsClnt() {
    console.log('========================================');
    console.log('分析 PB_EMPS_CLNT 中间表');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. 查看 PB_EMPS_CLNT 表结构
        // ========================================
        console.log('【1】PB_EMPS_CLNT 表结构');
        const cols = await conn.execute(`
            SELECT column_name, data_type
            FROM all_tab_columns
            WHERE table_name = 'PB_EMPS_CLNT' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        cols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
        });

        // ========================================
        // 2. 查看 PB_EMPS_CLNT 示例数据
        // ========================================
        console.log('\n【2】PB_EMPS_CLNT 表 - 示例数据');
        const data = await conn.execute(`
            SELECT *
            FROM ferp.pb_emps_clnt
            WHERE isactive = 'Y'
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   样例数据 (前20条):');
        data.rows.forEach((r, i) => {
            console.log(`   ${i+1}.`, JSON.stringify(r));
        });

        // ========================================
        // 3. 测试通过 PB_EMPS_CLNT 关联业务员
        // ========================================
        console.log('\n【3】测试：ord_bas -> pb_clnt -> pb_emps_clnt -> pb_dept_member');
        
        const testSql = `
            SELECT 
                b.serial as 单号，
                b.clntcde as 客户编码，
                c.clntnme as 客户名称，
                ec.empcde as 中间表业务员编码，
                m.empnme as 业务员姓名，
                m.dptnme as 部门名称
            FROM ferp.ord_bas b
            JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN ferp.pb_emps_clnt ec ON c.clntcde = ec.clntcde AND ec.isactive = 'Y'
            LEFT JOIN ferp.pb_dept_member m ON ec.empcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY b.created
            FETCH FIRST 20 ROWS ONLY
        `;
        
        const testResult = await conn.execute(testSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   返回 ${testResult.rows.length} 条记录:`);
        testResult.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 单号:${r.单号} 客户:${r.客户名称} 业务员编码:[${r.中间表业务员编码}] 业务员:${r.业务员姓名 || '(空)'} 部门:${r.部门名称 || '(空)'}`);
        });

        // ========================================
        // 4. 统计这种匹配方式的覆盖率
        // ========================================
        console.log('\n【4】统计 PB_EMPS_CLNT 匹配方式的覆盖率');
        
        const statsSql = `
            SELECT 
                COUNT(*) as 总单数，
                COUNT(ec.empcde) as 有中间表业务员的单数，
                COUNT(m.empcde) as 能匹配到pb_dept_member的单数
            FROM ferp.ord_bas b
            JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN ferp.pb_emps_clnt ec ON c.clntcde = ec.clntcde AND ec.isactive = 'Y'
            LEFT JOIN ferp.pb_dept_member m ON ec.empcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `;
        
        const statsResult = await conn.execute(statsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const s = statsResult.rows[0];
        console.log(`   总单数: ${s.总单数}`);
        console.log(`   有中间表业务员的单数: ${s.有中间表业务员的单数}`);
        console.log(`   能匹配到pb_dept_member的单数: ${s.能匹配到pb_dept_member的单数}`);
        console.log(`   匹配率: ${(s.能匹配到pb_dept_member的单数 / s.总单数 * 100).toFixed(1)}%`);

        // ========================================
        // 5. 对比三种匹配方式
        // ========================================
        console.log('\n【5】对比三种匹配方式');
        
        // 方式1: 直接用 ord_ct.agntcde
        const method1 = await conn.execute(`
            SELECT COUNT(DISTINCT b.serial) as cnt
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   方式1 (ord_ct.agntcde -> pb_dept_member): ${method1.rows[0].CNT}单`);
        
        // 方式2: 用 pb_emps_clnt
        const method2 = await conn.execute(`
            SELECT COUNT(DISTINCT b.serial) as cnt
            FROM ferp.ord_bas b
            JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            JOIN ferp.pb_emps_clnt ec ON c.clntcde = ec.clntcde AND ec.isactive = 'Y'
            JOIN ferp.pb_dept_member m ON ec.empcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   方式2 (pb_clnt -> pb_emps_clnt -> pb_dept_member): ${method2.rows[0].CNT}单`);
        
        // 方式3: 组合方式
        const method3 = await conn.execute(`
            SELECT COUNT(DISTINCT b.serial) as cnt
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN ferp.pb_emps_clnt ec ON c.clntcde = ec.clntcde AND ec.isactive = 'Y'
            LEFT JOIN ferp.pb_dept_member m ON (t.agntcde = m.empcde OR ec.empcde = m.empcde) AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND m.empcde IS NOT NULL
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   方式3 (组合方式): ${method3.rows[0].CNT}单`);

        console.log('\n========================================');
        console.log('分析完成');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

analyzeEmpsClnt().catch(console.error);
