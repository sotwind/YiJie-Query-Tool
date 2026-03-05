/**
 * 检查老厂新系统中业务员相关的表
 */

const oracledb = require('oracledb');

const DB_CONFIG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function main() {
    console.log('========================================');
    console.log('检查老厂新系统 - 业务员相关表');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 查找包含"dept"和"emp"或"user"的表
        console.log('【1】查找与部门/业务员相关的表：');
        const tablesSql = `
            SELECT table_name 
            FROM all_tables 
            WHERE table_name LIKE '%DEPT%' OR table_name LIKE '%EMP%' OR table_name LIKE '%USER%'
            ORDER BY table_name
        `;
        const tablesResult = await conn.execute(tablesSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (tablesResult.rows.length > 0) {
            console.log('   相关表：');
            tablesResult.rows.slice(0, 30).forEach(r => {
                console.log(`     ${r.TABLE_NAME}`);
            });
        }

        // 2. 检查 pb_emps 表（代码中使用的表）
        console.log('\n【2】检查 pb_emps 表：');
        const pbEmpsColsSql = `SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'PB_EMPS' ORDER BY column_id`;
        const pbEmpsColsResult = await conn.execute(pbEmpsColsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (pbEmpsColsResult.rows.length > 0) {
            console.log('   pb_emps 表字段：');
            pbEmpsColsResult.rows.forEach(c => {
                console.log(`     ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
            });

            // 查询销售 1 部的业务员
            console.log('\n【3】pb_emps 中销售 1 部的业务员：');
            const empSql = `
                SELECT empcde, empcde2, empnme, temcde, temnme 
                FROM pb_emps 
                WHERE temnme LIKE '%销售 1 部%' OR temcde = '1010205008'
                ORDER BY empnme
            `;
            const empResult = await conn.execute(empSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            
            if (empResult.rows.length > 0) {
                console.log(`   找到 ${empResult.rows.length} 名业务员：`);
                empResult.rows.forEach(r => {
                    console.log(`     ${r.EMPCDE} | ${r.EMPCDE2} | ${r.EMPNME} | ${r.TEMNME}`);
                });
            } else {
                console.log('   ⚠ 销售 1 部没有业务员');
            }
        } else {
            console.log('   ⚠ pb_emps 表不存在或无权限');
        }

        // 4. 检查 3 月 4 号订单的 agntcde 值
        console.log('\n【4】3 月 4 号订单的 agntcde 分布：');
        const agntSql = `
            SELECT t.agntcde, COUNT(*) as cnt
            FROM ord_bas b
            JOIN ord_ct t ON b.serial = t.serial
            WHERE b.isactive = 'Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
              AND t.agntcde IS NOT NULL
            GROUP BY t.agntcde
            ORDER BY cnt DESC
        `;
        const agntResult = await conn.execute(agntSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (agntResult.rows.length > 0) {
            console.log('   前 20 个业务员编码：');
            agntResult.rows.slice(0, 20).forEach(r => {
                console.log(`     ${r.AGNTCDE}: ${r.CNT}单`);
            });
        } else {
            console.log('   ⚠ 没有 agntcde 数据');
        }

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }

    console.log('\n========================================');
    console.log('检查完成');
    console.log('========================================');
}

main();
