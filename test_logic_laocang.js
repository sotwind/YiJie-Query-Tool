/**
 * 验证正确的业务逻辑（仅测试老厂）
 */

const oracledb = require('oracledb');

// 老厂新系统
const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function testCorrectLogic() {
    console.log('========================================');
    console.log('验证正确的业务逻辑（老厂）');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. 查看 pb_clnt 所有字段
        // ========================================
        console.log('【1】pb_clnt 客户表所有字段');
        const allCols = await conn.execute(`
            SELECT column_name, data_type
            FROM all_tab_columns
            WHERE table_name = 'PB_CLNT' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        allCols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
        });

        // ========================================
        // 2. 查看 pb_clnt 完整示例数据
        // ========================================
        console.log('\n【2】pb_clnt 完整示例数据');
        const clntData = await conn.execute(`
            SELECT *
            FROM ferp.pb_clnt
            WHERE isactive = 'Y'
            FETCH FIRST 5 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   样例数据 (前5条):');
        clntData.rows.forEach((r, i) => {
            console.log(`\n   --- 第 ${i+1} 条 ---`);
            Object.keys(r).forEach(key => {
                if (r[key] !== null && r[key] !== undefined) {
                    console.log(`     ${key}: ${r[key]}`);
                }
            });
        });

        // ========================================
        // 3. 检查哪些字段可能存储业务员信息
        // ========================================
        console.log('\n【3】检查 pb_clnt 中可能存储业务员的字段');
        
        // 检查 createdby/updatedby 是否有手机号格式的值
        const checkCreatedBy = await conn.execute(`
            SELECT DISTINCT createdby, COUNT(*) as cnt
            FROM ferp.pb_clnt
            WHERE isactive = 'Y' 
              AND createdby IS NOT NULL
              AND REGEXP_LIKE(createdby, '^[0-9]{11}$')
            GROUP BY createdby
            ORDER BY cnt DESC
            FETCH FIRST 10 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`\n   createdby 字段中有手机号格式的值 (${checkCreatedBy.rows.length}个):`);
        checkCreatedBy.rows.forEach(r => {
            console.log(`     [${r.CREATEDBY}]: ${r.CNT}条`);
        });

        // ========================================
        // 4. 关联订单和客户的 createdby
        // ========================================
        console.log('\n【4】测试：订单 -> pb_clnt.createdby -> pb_dept_member');
        
        const testSql = `
            SELECT 
                b.serial as 单号，
                b.clntcde as 客户编码，
                c.clntnme as 客户名称，
                c.createdby as 客户创建人，
                m.empnme as 业务员姓名，
                m.dptnme as 部门名称
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN ferp.pb_dept_member m ON c.createdby = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND REGEXP_LIKE(c.createdby, '^[0-9]{11}$')
            ORDER BY b.created
            FETCH FIRST 20 ROWS ONLY
        `;
        
        const testResult = await conn.execute(testSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   返回 ${testResult.rows.length} 条记录:`);
        testResult.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 单号:${r.单号} 客户:[${r.客户编码}] 创建人:[${r.客户创建人}] 业务员:${r.业务员姓名 || '(空)'} 部门:${r.部门名称 || '(空)'}`);
        });

        // ========================================
        // 5. 统计这种匹配方式的覆盖率
        // ========================================
        console.log('\n【5】统计 createdby 匹配方式的覆盖率');
        
        const statsSql = `
            SELECT 
                COUNT(*) as 总单数，
                COUNT(c.createdby) as 有createdby的单数，
                COUNT(m.empcde) as 能匹配到pb_dept_member的单数
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN ferp.pb_dept_member m ON c.createdby = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `;
        
        const statsResult = await conn.execute(statsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const s = statsResult.rows[0];
        console.log(`   总单数: ${s.总单数}`);
        console.log(`   有createdby的单数: ${s.有CREATEDBY的单数}`);
        console.log(`   能匹配到pb_dept_member的单数: ${s.能匹配到PB_DEPT_MEMBER的单数}`);
        console.log(`   匹配率: ${(s.能匹配到PB_DEPT_MEMBER的单数 / s.总单数 * 100).toFixed(1)}%`);

        // ========================================
        // 6. 对比两种方式
        // ========================================
        console.log('\n【6】对比两种匹配方式');
        
        // 方式1: ord_ct.agntcde -> pb_dept_member
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
        
        // 方式2: pb_clnt.createdby -> pb_dept_member
        const method2 = await conn.execute(`
            SELECT COUNT(DISTINCT b.serial) as cnt
            FROM ferp.ord_bas b
            JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            JOIN ferp.pb_dept_member m ON c.createdby = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   方式2 (pb_clnt.createdby -> pb_dept_member): ${method2.rows[0].CNT}单`);

        console.log('\n========================================');
        console.log('分析完成');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

testCorrectLogic().catch(console.error);
