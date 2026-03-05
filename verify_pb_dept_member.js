/**
 * 检查 PB_DEPT_MEMBER 表结构和数据
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
    console.log('检查 PB_DEPT_MEMBER 表');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            connectString: `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.service}`
        });

        // 1. 查询表结构
        console.log('【1】PB_DEPT_MEMBER 表结构：');
        const colsSql = `
            SELECT column_name, data_type, data_length, nullable 
            FROM all_tab_columns 
            WHERE owner = 'FERP' AND table_name = 'PB_DEPT_MEMBER' 
            ORDER BY column_id
        `;
        const colsResult = await conn.execute(colsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (colsResult.rows.length > 0) {
            console.log('   字段列表：');
            colsResult.rows.forEach(c => {
                console.log(`     ${c.COLUMN_NAME} - ${c.DATA_TYPE}(${c.DATA_LENGTH}) ${c.NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'}`);
            });
        } else {
            console.log('   ⚠ 无法查询表结构（可能是权限问题）');
        }

        // 2. 查询示例数据
        console.log('\n【2】PB_DEPT_MEMBER 示例数据（前 10 条）：');
        const sampleSql = `SELECT * FROM FERP.PB_DEPT_MEMBER WHERE ROWNUM <= 10`;
        const sampleResult = await conn.execute(sampleSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (sampleResult.rows.length > 0) {
            console.log('   列名：' + Object.keys(sampleResult.rows[0]).join(', '));
            sampleResult.rows.forEach((r, i) => {
                console.log(`   ${i+1}. ${JSON.stringify(r)}`);
            });
        }

        // 3. 查询销售 1 部的业务员
        console.log('\n【3】销售 1 部（1010205008）的业务员：');
        const sales1Sql = `
            SELECT * FROM FERP.PB_DEPT_MEMBER 
            WHERE dept_cde = '1010205008' AND isactive = 'Y'
            ORDER BY user_nme
        `;
        const sales1Result = await conn.execute(sales1Sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (sales1Result.rows.length > 0) {
            console.log(`   找到 ${sales1Result.rows.length} 名业务员：`);
            sales1Result.rows.forEach(r => {
                console.log(`     ${r.USER_CDE || r.MOBILE} | ${r.USER_NME} | ${r.DEPT_CDE}`);
            });
        } else {
            console.log('   ⚠ 销售 1 部没有业务员');
        }

        // 4. 检查 3 月 4 号的 agntcde 是否能匹配到销售 1 部
        console.log('\n【4】检查 3 月 4 号的 agntcde 是否属于销售 1 部：');
        const checkSql = `
            SELECT t.agntcde, m.user_nme, m.dept_cde, d.dptnme, COUNT(*) as cnt
            FROM ord_bas b
            JOIN ord_ct t ON b.serial = t.serial
            LEFT JOIN FERP.PB_DEPT_MEMBER m ON t.agntcde = m.user_cde
            LEFT JOIN FERP.PB_DEPT d ON m.dept_cde = d.dept_cde
            WHERE b.isactive = 'Y'
              AND b.created >= to_date('2026-03-04', 'yyyy-MM-dd')
              AND b.created < to_date('2026-03-05', 'yyyy-MM-dd')
            GROUP BY t.agntcde, m.user_nme, m.dept_cde, d.dptnme
            ORDER BY cnt DESC
        `;
        const checkResult = await conn.execute(checkSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (checkResult.rows.length > 0) {
            console.log('   前 20 条：');
            checkResult.rows.slice(0, 20).forEach(r => {
                console.log(`     ${r.AGNTCDE} | ${r.USER_NME || '无'} | ${r.DPTNME || '无'} (${r.DEPT_CDE || '无'}) | ${r.CNT}单`);
            });

            // 统计销售 1 部的订单
            const sales1Count = checkResult.rows.filter(r => r.DEPT_CDE === '1010205008' || r.DPTNME === '销售 1 部').reduce((sum, r) => sum + r.CNT, 0);
            console.log(`\n   销售 1 部总单数：${sales1Count}单`);
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
