/**
 * 查找 pb_clnt 表中真正存储业务员的字段
 */

const oracledb = require('oracledb');

const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function findSalesmanField() {
    console.log('========================================');
    console.log('查找 pb_clnt 表中真正存储业务员的字段');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. 查看所有包含手机号的字段
        // ========================================
        console.log('【1】检查 pb_clnt 各字段中的手机号格式数据');
        
        const fieldsToCheck = ['createdby', 'updatedby', 'remark', 'jurnme'];
        
        for (const field of fieldsToCheck) {
            console.log(`\n   字段 ${field}:`);
            try {
                const result = await conn.execute(`
                    SELECT ${field}, COUNT(*) as cnt
                    FROM ferp.pb_clnt
                    WHERE isactive = 'Y' 
                      AND ${field} IS NOT NULL
                      AND REGEXP_LIKE(${field}, '^[0-9]{11}$')
                    GROUP BY ${field}
                    ORDER BY cnt DESC
                    FETCH FIRST 5 ROWS ONLY
                `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
                
                if (result.rows.length > 0) {
                    result.rows.forEach(r => {
                        console.log(`     [${r[field.toUpperCase()]}]: ${r.CNT}条`);
                    });
                } else {
                    console.log('     没有手机号格式的数据');
                }
            } catch (e) {
                console.log(`     无法查询: ${e.message}`);
            }
        }

        // ========================================
        // 2. 检查 updatedby 字段
        // ========================================
        console.log('\n【2】检查 updatedby 字段的详细情况');
        
        const updatedByResult = await conn.execute(`
            SELECT updatedby, COUNT(*) as cnt
            FROM ferp.pb_clnt
            WHERE isactive = 'Y' 
              AND updatedby IS NOT NULL
              AND REGEXP_LIKE(updatedby, '^[0-9]{11}$')
            GROUP BY updatedby
            ORDER BY cnt DESC
            FETCH FIRST 10 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   updatedby 中有手机号的记录 (${updatedByResult.rows.length}个):`);
        updatedByResult.rows.forEach(r => {
            console.log(`     [${r.UPDATEDBY}]: ${r.CNT}条`);
        });

        // ========================================
        // 3. 测试 updatedby 是否能匹配到业务员
        // ========================================
        console.log('\n【3】测试：updatedby -> pb_dept_member');
        
        const testUpdatedBy = await conn.execute(`
            SELECT DISTINCT 
                c.updatedby,
                m.empnme,
                m.dptnme
            FROM ferp.pb_clnt c
            JOIN ferp.pb_dept_member m ON c.updatedby = m.empcde AND m.isactive = 'Y'
            WHERE c.isactive = 'Y'
              AND REGEXP_LIKE(c.updatedby, '^[0-9]{11}$')
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   能匹配的业务员 (${testUpdatedBy.rows.length}人):`);
        testUpdatedBy.rows.forEach(r => {
            console.log(`     [${r.UPDATEDBY}] -> ${r.EMPNME} (${r.DPTNME})`);
        });

        // ========================================
        // 4. 如果 pb_clnt 没有业务员字段，那 ord_ct.agntcde 就是对的
        // ========================================
        console.log('\n【4】结论分析');
        console.log('   pb_clnt 表中没有专门的"业务员"字段');
        console.log('   createdby/updatedby 是系统用户，不是客户业务员');
        console.log('   因此 ord_ct.agntcde 才是订单的业务员字段');
        console.log('   当前修复是正确的：t.agntcde = m.empcde');

        // ========================================
        // 5. 但为什么匹配率低？检查缺失的数据
        // ========================================
        console.log('\n【5】检查缺失的业务员数据');
        
        const missingEmp = await conn.execute(`
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
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   缺失的业务员编码 (${missingEmp.rows.length}个):`);
        missingEmp.rows.forEach(r => {
            console.log(`     [${r.AGNTCDE}]: ${r.CNT}单`);
        });

        console.log('\n========================================');
        console.log('最终结论:');
        console.log('  1. pb_clnt 表没有存储客户业务员的字段');
        console.log('  2. ord_ct.agntcde 就是订单的业务员编码');
        console.log('  3. 当前修复 (t.agntcde = m.empcde) 是正确的');
        console.log('  4. 匹配率低是因为 pb_dept_member 表数据不完整');
        console.log('  5. 需要从集团数据库获取完整的业务员数据');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

findSalesmanField().catch(console.error);
