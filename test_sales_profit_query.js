/**
 * 测试销售员图和利润统计的 SQL 查询
 * 使用 oracledb 直接连接 Oracle 数据库进行验证
 */

const oracledb = require('oracledb');

// 数据库连接配置
const DB_CONFIGS = {
    易捷集团: {
        name: '易捷集团',
        host: '36.138.130.91',
        port: 1521,
        service: 'dbms',
        user: 'fgrp',
        password: 'kuke.fgrp'
    },
    新厂新系统: {
        name: '新厂新系统',
        host: '36.134.7.141',
        port: 1521,
        service: 'dbms',
        user: 'ferp',
        password: 'kuke.b0003'
    },
    老厂新系统: {
        name: '老厂新系统',
        host: '36.138.132.30',
        port: 1521,
        service: 'dbms',
        user: 'read',
        password: 'ejsh.read'
    },
    温森新系统: {
        name: '温森新系统',
        host: 'db.05.forestpacking.com',
        port: 1521,
        service: 'dbms',
        user: 'read',
        password: 'ejsh.read'
    }
};

// 测试日期（前天：2026-03-03）
const TEST_DATE_FROM = '2026-03-03';
const TEST_DATE_TO = '2026-03-04';

async function testConnection(dbConfig) {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: `${dbConfig.host}:${dbConfig.port}/${dbConfig.service}`
        });
        console.log(`✓ ${dbConfig.name} 连接成功`);
        return connection;
    } catch (err) {
        console.log(`✗ ${dbConfig.name} 连接失败：${err.message}`);
        return null;
    }
}

async function runQuery(connection, sql, params = []) {
    try {
        const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return result.rows;
    } catch (err) {
        console.log(`  查询错误：${err.message}`);
        return null;
    }
}

async function main() {
    console.log('========================================');
    console.log('易捷查询 - SQL 验证测试');
    console.log(`测试日期范围：${TEST_DATE_FROM} 到 ${TEST_DATE_TO}`);
    console.log('========================================\n');

    // ========== 测试 1: 验证 pb_dept_member 表结构和数据 ==========
    console.log('【测试 1】验证 pb_dept_member 表（易捷集团数据库）');
    console.log('----------------------------------------');
    
    let conn = await testConnection(DB_CONFIGS.易捷集团);
    if (conn) {
        // 1.1 查询表结构
        console.log('\n1.1 PB_DEPT_MEMBER 表字段：');
        const cols = await runQuery(conn, `
            SELECT column_name, data_type, data_length 
            FROM user_tab_columns 
            WHERE table_name = 'PB_DEPT_MEMBER' 
            ORDER BY column_id
        `);
        if (cols) {
            cols.forEach(c => console.log(`   ${c.COLUMN_NAME} - ${c.DATA_TYPE}(${c.DATA_LENGTH})`));
        }

        // 1.2 测试修复后的业务员查询 SQL（模块_通用函数.cs 中的逻辑）
        console.log('\n1.2 测试业务员查询 SQL（修复后）：');
        const empSql = `
            SELECT m.user_cde as EMPCDE, m.dept_cde as TEMCDE, m.dept_cde as TEMCDE2, 
                   m.user_nme as EMPNME, d.dept_nme as TEMNME
            FROM pb_dept_member m
            LEFT JOIN pb_dept d ON m.dept_cde = d.dept_cde
            WHERE m.isactive = 'Y'
            ORDER BY d.dept_nme, m.user_nme
        `;
        const empData = await runQuery(conn, empSql);
        if (empData) {
            console.log(`   ✓ 查询成功，返回 ${empData.length} 条业务员数据`);
            console.log('   前 5 条示例：');
            empData.slice(0, 5).forEach((r, i) => {
                console.log(`     ${i+1}. ${r.EMPNME} - ${r.TEMNME} (${r.TEMCDE})`);
            });
        }

        // 1.3 测试部门查询
        console.log('\n1.3 测试部门数据：');
        const deptSql = `
            SELECT DISTINCT d.dept_cde, d.dept_nme
            FROM pb_dept d
            WHERE d.dept_nme LIKE '%销售%'
            ORDER BY d.dept_nme
        `;
        const deptData = await runQuery(conn, deptSql);
        if (deptData) {
            console.log(`   ✓ 查询成功，返回 ${deptData.length} 个销售部门`);
            deptData.slice(0, 10).forEach((r, i) => {
                console.log(`     ${i+1}. ${r.DEPT_NME} (${r.DEPT_CDE})`);
            });
        }

        await conn.close();
    }

    // ========== 测试 2: 验证利润统计 SQL（窗体_利润统计.cs） ==========
    console.log('\n\n【测试 2】验证利润统计 SQL（新厂新系统数据库）');
    console.log('----------------------------------------');
    
    conn = await testConnection(DB_CONFIGS.新厂新系统);
    if (conn) {
        // 2.1 利润统计 SQL（修复后的版本）
        console.log('\n2.1 测试利润统计查询 SQL：');
        const profitSql = `
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    e.empnme as 业务员，
    d.dptnme as 部门，
    nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 报价总金额，
    nvl(b.accamt, 0) as 卖价总金额，
    nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 利润差额，
    case 
        when nvl(b.quoprc, 0) * nvl(b.accnum, 0) = 0 then 0
        else (nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) / (nvl(b.quoprc, 0) * nvl(b.accnum, 0)) * 100
    end as 利率
FROM ord_bas b
LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ord_ct t ON b.serial = t.serial
LEFT JOIN pb_dept_member e ON t.agntcde = e.mobile
LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= to_date('${TEST_DATE_FROM}', 'yyyy-MM-dd')
  AND b.created < to_date('${TEST_DATE_TO}', 'yyyy-MM-dd')
ORDER BY b.created
        `;
        
        console.log('   SQL 预览（前 500 字符）：');
        console.log('   ' + profitSql.substring(0, 500).replace(/\n/g, '\n   ') + '...');
        
        const profitData = await runQuery(conn, profitSql);
        if (profitData) {
            console.log(`\n   ✓ 查询成功，返回 ${profitData.length} 条利润统计数据`);
            if (profitData.length > 0) {
                console.log('   前 5 条示例：');
                profitData.slice(0, 5).forEach((r, i) => {
                    console.log(`     ${i+1}. ${r.日期} | ${r.单号} | ${r.产品} | ${r.业务员 || '无'} | ${r.部门 || '无'} | 利率:${r.利率?.toFixed(2)}%`);
                });
            }
        }

        // 2.2 测试带部门筛选的 SQL
        console.log('\n2.2 测试带部门筛选的查询（销售 1 部）：');
        // 先获取销售 1 部的部门编码
        const deptCodeSql = `SELECT dept_cde FROM pb_dept WHERE dept_nme LIKE '%销售 1 部%' OR dept_nme LIKE '%销售一部%'`;
        const deptCodeResult = await runQuery(conn, deptCodeSql);
        
        // 注意：部门表在易捷集团数据库，这里用 pb_dept_member 测试
        const filteredSql = `
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    e.empnme as 业务员，
    d.dptnme as 部门，
    nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 报价总金额，
    nvl(b.accamt, 0) as 卖价总金额,
    nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 利润差额
FROM ord_bas b
LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ord_ct t ON b.serial = t.serial
LEFT JOIN pb_dept_member e ON t.agntcde = e.mobile
LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= to_date('${TEST_DATE_FROM}', 'yyyy-MM-dd')
  AND b.created < to_date('${TEST_DATE_TO}', 'yyyy-MM-dd')
  AND d.dept_cde IN (SELECT dept_cde FROM pb_dept WHERE dept_nme LIKE '%销售%')
ORDER BY b.created
        `;
        
        const filteredData = await runQuery(conn, filteredSql);
        if (filteredData) {
            console.log(`   ✓ 查询成功，返回 ${filteredData.length} 条数据（筛选销售部门）`);
        }

        await conn.close();
    }

    // ========== 测试 3: 验证销售员图 SQL（窗体_销售员图.cs） ==========
    console.log('\n\n【测试 3】验证销售员图 SQL');
    console.log('----------------------------------------');
    
    // 销售员图查询所有数据库，这里测试新厂新系统
    conn = await testConnection(DB_CONFIGS.新厂新系统);
    if (conn) {
        console.log('\n3.1 测试销售员图统计 SQL：');
        const salesSql = `
SELECT 
    e.empnme as 业务员，
    d.dptnme as 部门，
    COUNT(DISTINCT b.serial) as 单数，
    SUM(nvl(b.accnum, 0)) as 总数量，
    SUM(nvl(b.accamt, 0)) as 总金额
FROM ord_bas b
LEFT JOIN ord_ct t ON b.serial = t.serial
LEFT JOIN pb_dept_member e ON t.agntcde = e.mobile
LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= to_date('${TEST_DATE_FROM}', 'yyyy-MM-dd')
  AND b.created < to_date('${TEST_DATE_TO}', 'yyyy-MM-dd')
GROUP BY e.empnme, d.dptnme
ORDER BY SUM(nvl(b.accamt, 0)) DESC
        `;
        
        const salesData = await runQuery(conn, salesSql);
        if (salesData) {
            console.log(`   ✓ 查询成功，返回 ${salesData.length} 个业务员统计数据`);
            if (salesData.length > 0) {
                console.log('   前 10 条示例：');
                salesData.slice(0, 10).forEach((r, i) => {
                    console.log(`     ${i+1}. ${r.业务员 || '无'} | ${r.部门 || '无'} | ${r.单数}单 | ${r.总金额?.toFixed(2)}元`);
                });
            }
        }

        await conn.close();
    }

    // ========== 测试 4: 检查 ord_ct 表的 agntcde 字段 ==========
    console.log('\n\n【测试 4】验证 ord_ct 表关联字段');
    console.log('----------------------------------------');
    
    conn = await testConnection(DB_CONFIGS.新厂新系统);
    if (conn) {
        console.log('\n4.1 ORD_CT 表字段（检查 agntcde）：');
        const ordCtCols = await runQuery(conn, `
            SELECT column_name, data_type 
            FROM user_tab_columns 
            WHERE table_name = 'ORD_CT' 
            ORDER BY column_id
        `);
        if (ordCtCols) {
            const relevantCols = ordCtCols.filter(c => 
                c.COLUMN_NAME.toLowerCase().includes('agnt') || 
                c.COLUMN_NAME.toLowerCase().includes('mobile')
            );
            if (relevantCols.length > 0) {
                relevantCols.forEach(c => console.log(`   ${c.COLUMN_NAME} - ${c.DATA_TYPE}`));
            } else {
                console.log('   未找到与 agnt/mobile 相关的字段');
                // 显示所有字段
                console.log('   所有字段：');
                ordCtCols.slice(0, 20).forEach(c => console.log(`     ${c.COLUMN_NAME}`));
            }
        }

        // 测试 ord_ct 中 agntcde 的实际数据
        console.log('\n4.2 测试 ord_ct 表的 agntcde 数据：');
        const agntSql = `
            SELECT DISTINCT t.agntcde, e.empnme
            FROM ord_ct t
            LEFT JOIN pb_dept_member e ON t.agntcde = e.mobile
            WHERE t.agntcde IS NOT NULL
            AND ROWNUM <= 10
        `;
        const agntData = await runQuery(conn, agntSql);
        if (agntData) {
            console.log(`   ✓ 查询成功，返回 ${agntData.length} 条记录`);
            agntData.forEach((r, i) => {
                console.log(`     ${i+1}. agntcde=${r.AGNTCDE} -> 业务员=${r.EMPNME || '未匹配'}`);
            });
        }

        await conn.close();
    }

    console.log('\n\n========================================');
    console.log('测试完成！');
    console.log('========================================');
}

main().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
