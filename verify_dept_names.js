/**
 * 验证各部门数据库中的销售部门名称
 */

const oracledb = require('oracledb');

// 使用 Thick 模式（需要 Oracle 客户端）
// oracledb.initOracleClient({ libDir: '/path/to/oracle/client' });

const DB_CONFIGS = [
    { name: '易捷集团', host: '36.138.130.91', port: 1521, service: 'dbms', user: 'fgrp', password: 'kuke.fgrp' },
    { name: '老厂新系统', host: '36.138.132.30', port: 1521, service: 'dbms', user: 'read', password: 'ejsh.read' },
    { name: '温森新系统', host: 'db.05.forestpacking.com', port: 1521, service: 'dbms', user: 'read', password: 'ejsh.read' }
];

async function main() {
    console.log('========================================');
    console.log('验证销售部门名称');
    console.log('========================================\n');

    for (const dbConfig of DB_CONFIGS) {
        console.log(`【${dbConfig.name}】`);
        let conn;
        try {
            conn = await oracledb.getConnection({
                user: dbConfig.user,
                password: dbConfig.password,
                connectString: `${dbConfig.host}:${dbConfig.port}/${dbConfig.service}`
            });

            // 查询所有销售相关部门
            const sql = `SELECT DISTINCT dept_cde, dept_nme FROM pb_dept WHERE dept_nme LIKE '%销售%' ORDER BY dept_nme`;
            const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            
            if (result.rows.length > 0) {
                console.log(`   找到 ${result.rows.length} 个销售部门：`);
                result.rows.slice(0, 20).forEach(r => {
                    console.log(`     ${r.DEPT_CDE} - ${r.DEPT_NME}`);
                });
            } else {
                console.log('   未找到销售部门');
            }

        } catch (err) {
            console.log(`   连接失败：${err.message}`);
        } finally {
            if (conn) try { await conn.close(); } catch {}
        }
        console.log('');
    }
}

main();
