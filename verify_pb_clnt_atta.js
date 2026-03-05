/**
 * 验证正确的业务逻辑：
 * ord_bas -> pb_clnt_atta -> pb_dept_member
 */

const oracledb = require('oracledb');

const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function verifyCorrectLogic() {
    console.log('========================================');
    console.log('验证正确的业务逻辑');
    console.log('ord_bas(clntcde) -> pb_clnt_atta -> pb_dept_member');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. 查看 pb_clnt_atta 表结构
        // ========================================
        console.log('【1】pb_clnt_atta 表结构');
        const cols = await conn.execute(`
            SELECT column_name, data_type
            FROM all_tab_columns
            WHERE table_name = 'PB_CLNT_ATTA' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        cols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
        });

        // ========================================
        // 2. 查看 pb_clnt_atta 示例数据
        // ========================================
        console.log('\n【2】pb_clnt_atta 表 - 示例数据');
        const data = await conn.execute(`
            SELECT *
            FROM ferp.pb_clnt_atta
            WHERE isactive = 'Y'
            FETCH FIRST 10 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   样例数据 (前10条):');
        data.rows.forEach((r, i) => {
            console.log(`\n   --- 第 ${i+1} 条 ---`);
            Object.keys(r).forEach(key => {
                if (r[key] !== null && r[key] !== undefined) {
                    console.log(`     ${key}: ${r[key]}`);
                }
            });
        });

        // ========================================
        // 3. 测试正确逻辑：订单 -> pb_clnt_atta -> pb_dept_member
        // ========================================
        console.log('\n【3】测试：订单 -> pb_clnt_atta -> pb_dept_member');
        
        const testSql = `
            SELECT 
                b.serial as 单号，
                b.clntcde as 订单客户编码，
                ca.clntcde as atta客户编码，
                ca.agntcde as 业务员编码，
                m.empnme as 业务员姓名，
                m.dptnme as 部门名称
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt_atta ca ON b.clntcde = ca.clntcde AND ca.isactive = 'Y'
            LEFT JOIN ferp.pb_dept_member m ON ca.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY b.created
            FETCH FIRST 20 ROWS ONLY
        `;
        
        const testResult = await conn.execute(testSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   返回 ${testResult.rows.length} 条记录:`);
        testResult.rows.forEach((r, i) => {
            const status = r.业务员姓名 ? '✓' : '✗';
            console.log(`   ${status} ${i+1}. 单号:${r.单号} 客户:[${r.订单客户编码}] 业务员:[${r.业务员编码}] ${r.业务员姓名 || '(空)'} ${r.部门名称 || ''}`);
        });

        // ========================================
        // 4. 统计匹配率
        // ========================================
        console.log('\n【4】统计 pb_clnt_atta 匹配方式的覆盖率');
        
        const statsSql = `
            SELECT 
                COUNT(*) as 总单数，
                COUNT(ca.agntcde) as 有atta业务员的单数，
                COUNT(m.empcde) as 能匹配到pb_dept_member的单数
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt_atta ca ON b.clntcde = ca.clntcde AND ca.isactive = 'Y'
            LEFT JOIN ferp.pb_dept_member m ON ca.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `;
        
        const statsResult = await conn.execute(statsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const s = statsResult.rows[0];
        console.log(`   总单数: ${s.总单数}`);
        console.log(`   有pb_clnt_atta业务员的单数: ${s.有ATTA业务员的单数}`);
        console.log(`   能匹配到pb_dept_member的单数: ${s.能匹配到PB_DEPT_MEMBER的单数}`);
        console.log(`   匹配率: ${(s.能匹配到PB_DEPT_MEMBER的单数 / s.总单数 * 100).toFixed(1)}%`);

        // ========================================
        // 5. 检查吴玉龙的情况
        // ========================================
        console.log('\n【5】检查吴玉龙的情况（13666446624）');
        
        // 检查 pb_clnt_atta 中是否有这个编码
        const wuyulongCheck = await conn.execute(`
            SELECT DISTINCT b.serial, b.clntcde, ca.agntcde
            FROM ferp.ord_bas b
            JOIN ferp.pb_clnt_atta ca ON b.clntcde = ca.clntcde
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND ca.agntcde = '13666446624'
            FETCH FIRST 5 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (wuyulongCheck.rows.length > 0) {
            console.log(`   ✓ 找到 ${wuyulongCheck.rows.length} 条吴玉龙的订单:`);
            wuyulongCheck.rows.forEach(r => {
                console.log(`     单号:${r.SERIAL} 客户:[${r.CLNTCDE}] 业务员编码:[${r.EMPCDE}]`);
            });
        } else {
            console.log('   ✗ 没有找到吴玉龙的订单（通过pb_clnt_atta）');
        }

        // 对比直接用 ord_ct.agntcde
        const wuyulongDirect = await conn.execute(`
            SELECT DISTINCT b.serial, t.agntcde
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND t.agntcde = '13666446624'
            FETCH FIRST 5 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (wuyulongDirect.rows.length > 0) {
            console.log(`   \n   通过 ord_ct.agntcde 找到 ${wuyulongDirect.rows.length} 条吴玉龙的订单:`);
            wuyulongDirect.rows.forEach(r => {
                console.log(`     单号:${r.SERIAL} agntcde:[${r.AGNTCDE}]`);
            });
        }

        // ========================================
        // 6. 对比两种方式的差异
        // ========================================
        console.log('\n【6】对比两种方式');
        
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
        
        // 方式2: pb_clnt_atta -> pb_dept_member
        const method2 = await conn.execute(`
            SELECT COUNT(DISTINCT b.serial) as cnt
            FROM ferp.ord_bas b
            JOIN ferp.pb_clnt_atta ca ON b.clntcde = ca.clntcde AND ca.isactive = 'Y'
            JOIN ferp.pb_dept_member m ON ca.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   方式2 (pb_clnt_atta -> pb_dept_member): ${method2.rows[0].CNT}单`);

        console.log('\n========================================');
        console.log('结论:');
        console.log('  如果方式2的匹配率更高，说明 pb_clnt_atta 是正确的关联表');
        console.log('  需要修改代码使用新的关联逻辑');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

verifyCorrectLogic().catch(console.error);
