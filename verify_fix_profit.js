/**
 * 验证修复后的利润统计查询
 * 测试修复后的 SQL 是否能正确返回数据
 */

const oracledb = require('oracledb');

// 老厂新系统数据库配置
const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

// 温森新系统数据库配置
const DB_CONFIG_WENSEN = {
    host: 'db.05.forestpacking.com',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function testProfitQuery(dbConfig, dbName) {
    console.log(`\n========================================`);
    console.log(`测试数据库: ${dbName}`);
    console.log(`========================================`);

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: `${dbConfig.host}:${dbConfig.port}/${dbConfig.service}`
        });

        // 测试 1: 基础查询（无筛选）
        console.log('\n【测试 1】基础查询（2026-03-04）');
        const baseSql = `
            SELECT 
                TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
                b.serial as 单号，
                c.clntnme as 客户，
                b.prdnme as 产品，
                m.empnme as 业务员，
                m.dptnme as 部门，
                nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 报价总金额，
                nvl(b.accamt, 0) as 卖价总金额
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY b.created
            FETCH FIRST 10 ROWS ONLY
        `;
        
        const baseResult = await conn.execute(baseSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   返回 ${baseResult.rows.length} 条记录`);
        
        if (baseResult.rows.length > 0) {
            console.log('   样例数据:');
            baseResult.rows.slice(0, 3).forEach((r, i) => {
                console.log(`   ${i+1}. 单号:${r.单号} 业务员:${r.业务员 || '(空)'} 部门:${r.部门 || '(空)'}`);
            });
        }

        // 测试 2: 统计总数
        console.log('\n【测试 2】统计汇总');
        const summarySql = `
            SELECT 
                COUNT(*) as 总单数，
                SUM(nvl(b.accamt, 0)) as 总卖价，
                COUNT(DISTINCT m.empnme) as 有业务员的单数
            FROM ferp.ord_bas b
            LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
        `;
        
        const summaryResult = await conn.execute(summarySql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const s = summaryResult.rows[0];
        console.log(`   总单数: ${s.总单数}`);
        console.log(`   总卖价: ${s.总卖价}`);
        console.log(`   能匹配到业务员的单数: ${s.有业务员的单数}`);

        // 测试 3: 部门筛选测试
        console.log('\n【测试 3】部门筛选测试');
        
        // 先查询有哪些部门
        const deptListSql = `
            SELECT DISTINCT m.dptnme
            FROM ferp.ord_bas b
            LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND m.dptnme IS NOT NULL
            ORDER BY m.dptnme
        `;
        
        const deptListResult = await conn.execute(deptListSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   涉及部门 (${deptListResult.rows.length}个):`);
        deptListResult.rows.forEach(r => {
            console.log(`     - ${r.DPTNME}`);
        });

        // 测试销售 1 部筛选
        if (deptListResult.rows.some(r => r.DPTNME === '销售 1 部')) {
            const sales1Sql = `
                SELECT 
                    COUNT(*) as 单数，
                    SUM(nvl(b.accamt, 0)) as 金额
                FROM ferp.ord_bas b
                LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
                LEFT JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
                WHERE b.isactive = 'Y'
                  AND b.created >= DATE '2026-03-04'
                  AND b.created < DATE '2026-03-05'
                  AND m.dptnme = '销售 1 部'
            `;
            
            const sales1Result = await conn.execute(sales1Sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            const s1 = sales1Result.rows[0];
            console.log(`\n   销售 1 部: ${s1.单数}单, 金额 ${s1.金额}`);
        }

        // 测试 4: 业务员筛选测试
        console.log('\n【测试 4】业务员筛选测试');
        
        // 查询有订单的业务员
        const empListSql = `
            SELECT DISTINCT t.agntcde, m.empnme
            FROM ferp.ord_bas b
            LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_dept_member m ON t.agntcde = m.empcde AND m.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND t.agntcde IS NOT NULL
            ORDER BY m.empnme
            FETCH FIRST 5 ROWS ONLY
        `;
        
        const empListResult = await conn.execute(empListSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   前5名业务员:`);
        empListResult.rows.forEach(r => {
            console.log(`     - ${r.AGNTCDE} (${r.EMPNME || '未知'})`);
        });

        // 测试第一个业务员的筛选
        if (empListResult.rows.length > 0) {
            const firstEmpCode = empListResult.rows[0].AGNTCDE;
            const empFilterSql = `
                SELECT COUNT(*) as 单数
                FROM ferp.ord_bas b
                LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
                WHERE b.isactive = 'Y'
                  AND b.created >= DATE '2026-03-04'
                  AND b.created < DATE '2026-03-05'
                  AND t.agntcde = '${firstEmpCode}'
            `;
            
            const empFilterResult = await conn.execute(empFilterSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            console.log(`\n   业务员 ${firstEmpCode}: ${empFilterResult.rows[0].单数}单`);
        }

        console.log(`\n✅ ${dbName} 测试通过`);
        return true;

    } catch (err) {
        console.error(`\n❌ ${dbName} 测试失败:`, err.message);
        return false;
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

async function main() {
    console.log('========================================');
    console.log('利润统计查询修复验证');
    console.log('========================================');
    console.log('测试日期: 2026-03-04');
    console.log('修复内容:');
    console.log('  1. JOIN 条件: e.mobile -> m.empcde');
    console.log('  2. 移除 pb_dept JOIN, 直接使用 m.dptnme');
    console.log('  3. 部门筛选: d.dept_cde -> m.dptnme');
    console.log('  4. 业务员筛选: h.mobile -> t.agntcde');

    // 测试老厂新系统
    const laocangResult = await testProfitQuery(DB_CONFIG_LAOCANG, '老厂新系统');
    
    // 测试温森新系统
    const wensenResult = await testProfitQuery(DB_CONFIG_WENSEN, '温森新系统');

    console.log('\n========================================');
    console.log('验证结果汇总');
    console.log('========================================');
    console.log(`老厂新系统: ${laocangResult ? '✅ 通过' : '❌ 失败'}`);
    console.log(`温森新系统: ${wensenResult ? '✅ 通过' : '❌ 失败'}`);
    
    if (laocangResult && wensenResult) {
        console.log('\n🎉 所有测试通过！修复成功。');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查错误信息。');
    }
}

main().catch(console.error);
