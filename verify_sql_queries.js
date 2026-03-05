/**
 * 验证易捷查询项目的 SQL 语句
 * 测试销售员图和利润统计的 SQL 逻辑
 * 使用前天 (2026-03-04) 的数据进行验证
 */

const oracledb = require('oracledb');

// 数据库连接配置
const DB_CONFIGS = {
    yijie_group: {
        name: '易捷集团',
        host: '36.138.130.91',
        port: 1521,
        service: 'dbms',
        user: 'fgrp',
        password: 'kuke.fgrp'
    },
    new_factory: {
        name: '新厂新系统',
        host: '36.134.7.141',
        port: 1521,
        service: 'dbms',
        user: 'ferp',
        password: 'kuke.b0003'
    },
    old_factory: {
        name: '老厂新系统',
        host: '36.138.132.30',
        port: 1521,
        service: 'dbms',
        user: 'read',
        password: 'ejsh.read'
    },
    wensen: {
        name: '温森新系统',
        host: 'db.05.forestpacking.com',
        port: 1521,
        service: 'dbms',
        user: 'read',
        password: 'ejsh.read'
    }
};

// 测试日期（前天：2026-03-04）
const TEST_DATE_FROM = '2026-03-04';
const TEST_DATE_TO = '2026-03-05';

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

    const results = [];

    // ========== 测试 1: 销售员图 SQL（窗体_销售员图.cs 中的逻辑） ==========
    console.log('【测试 1】销售员图 SQL 验证');
    console.log('----------------------------------------');
    
    // 销售员图 SQL（来自窗体_销售员图.cs）
    const salesRepSql = `
        SELECT b.objtyp, t.agntcde, nvl(sum(b.accamt),0) as 金额，
               nvl(sum(t.acreage * t.ordnum),0) as 面积，
               count(*) as 单数 
        FROM ord_bas b 
        JOIN ord_ct t ON b.serial = t.serial 
        WHERE b.isactive='Y'
          AND b.created >= TO_DATE('${TEST_DATE_FROM}', 'YYYY-MM-DD') 
          AND b.created < TO_DATE('${TEST_DATE_TO}', 'YYYY-MM-DD')
        GROUP BY t.agntcde, b.objtyp 
        ORDER BY t.agntcde
    `;

    console.log('\n1.1 新厂新系统 - 销售员图查询：');
    let conn = await testConnection(DB_CONFIGS.new_factory);
    if (conn) {
        const salesData = await runQuery(conn, salesRepSql);
        if (salesData) {
            console.log(`   ✓ 查询成功，返回 ${salesData.length} 条数据`);
            if (salesData.length > 0) {
                console.log('   前 10 条示例：');
                salesData.slice(0, 10).forEach((r, i) => {
                    console.log(`     ${i+1}. 业务员=${r.AGNTCDE || '无'} | 产品类型=${r.OBJTYP} | 金额=${Number(r.金额||0).toFixed(2)} | 面积=${Number(r.面积||0).toFixed(2)} | 单数=${r.单数}`);
                });
                
                // 汇总统计
                const totalAmount = salesData.reduce((sum, r) => sum + Number(r.金额||0), 0);
                const totalArea = salesData.reduce((sum, r) => sum + Number(r.面积||0), 0);
                const totalOrders = salesData.reduce((sum, r) => sum + Number(r.单数||0), 0);
                console.log(`   汇总：总金额=${totalAmount.toFixed(2)} | 总面积=${totalArea.toFixed(2)} | 总单数=${totalOrders}`);
            } else {
                console.log('   ⚠ 该日期范围内无数据');
            }
            results.push({ test: '销售员图 - 新厂新系统', status: '成功', rows: salesData.length });
        } else {
            results.push({ test: '销售员图 - 新厂新系统', status: '失败', rows: 0 });
        }
        await conn.close();
    }

    console.log('\n1.2 老厂新系统 - 销售员图查询：');
    conn = await testConnection(DB_CONFIGS.old_factory);
    if (conn) {
        const salesData = await runQuery(conn, salesRepSql);
        if (salesData) {
            console.log(`   ✓ 查询成功，返回 ${salesData.length} 条数据`);
            if (salesData.length > 0) {
                console.log('   前 10 条示例：');
                salesData.slice(0, 10).forEach((r, i) => {
                    console.log(`     ${i+1}. 业务员=${r.AGNTCDE || '无'} | 产品类型=${r.OBJTYP} | 金额=${Number(r.金额||0).toFixed(2)} | 面积=${Number(r.面积||0).toFixed(2)} | 单数=${r.单数}`);
                });
                
                const totalAmount = salesData.reduce((sum, r) => sum + Number(r.金额||0), 0);
                const totalArea = salesData.reduce((sum, r) => sum + Number(r.面积||0), 0);
                const totalOrders = salesData.reduce((sum, r) => sum + Number(r.单数||0), 0);
                console.log(`   汇总：总金额=${totalAmount.toFixed(2)} | 总面积=${totalArea.toFixed(2)} | 总单数=${totalOrders}`);
            } else {
                console.log('   ⚠ 该日期范围内无数据');
            }
            results.push({ test: '销售员图 - 老厂新系统', status: '成功', rows: salesData.length });
        } else {
            results.push({ test: '销售员图 - 老厂新系统', status: '失败', rows: 0 });
        }
        await conn.close();
    }

    // ========== 测试 2: 利润统计 SQL（窗体_利润统计.cs 中的逻辑） ==========
    console.log('\n\n【测试 2】利润统计 SQL 验证');
    console.log('----------------------------------------');
    
    // 利润统计 SQL（来自窗体_利润统计.cs）
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
  AND b.created >= TO_DATE('${TEST_DATE_FROM}', 'YYYY-MM-DD')
  AND b.created < TO_DATE('${TEST_DATE_TO}', 'YYYY-MM-DD')
ORDER BY b.created
    `;

    console.log('\n2.1 新厂新系统 - 利润统计查询：');
    conn = await testConnection(DB_CONFIGS.新厂新系统);
    if (conn) {
        const profitData = await runQuery(conn, profitSql);
        if (profitData) {
            console.log(`   ✓ 查询成功，返回 ${profitData.length} 条数据`);
            if (profitData.length > 0) {
                console.log('   前 10 条示例：');
                profitData.slice(0, 10).forEach((r, i) => {
                    console.log(`     ${i+1}. ${r.日期} | ${r.单号} | ${r.产品} | ${r.业务员 || '无'} | ${r.部门 || '无'}`);
                    console.log(`        报价=${Number(r.报价总金额||0).toFixed(2)} | 卖价=${Number(r.卖价总金额||0).toFixed(2)} | 利润=${Number(r.利润差额||0).toFixed(2)} | 利率=${Number(r.利率||0).toFixed(2)}%`);
                });
                
                // 汇总统计
                const totalQuote = profitData.reduce((sum, r) => sum + Number(r.报价总金额||0), 0);
                const totalSell = profitData.reduce((sum, r) => sum + Number(r.卖价总金额||0), 0);
                const totalProfit = profitData.reduce((sum, r) => sum + Number(r.利润差额||0), 0);
                const avgRate = totalQuote > 0 ? (totalProfit / totalQuote * 100) : 0;
                console.log(`   汇总：总报价=${totalQuote.toFixed(2)} | 总卖价=${totalSell.toFixed(2)} | 总利润=${totalProfit.toFixed(2)} | 平均利率=${avgRate.toFixed(2)}%`);
            } else {
                console.log('   ⚠ 该日期范围内无数据');
            }
            results.push({ test: '利润统计 - 新厂新系统', status: '成功', rows: profitData.length });
        } else {
            results.push({ test: '利润统计 - 新厂新系统', status: '失败', rows: 0 });
        }
        await conn.close();
    }

    console.log('\n2.2 老厂新系统 - 利润统计查询：');
    conn = await testConnection(DB_CONFIGS.老厂新系统);
    if (conn) {
        const profitData = await runQuery(conn, profitSql);
        if (profitData) {
            console.log(`   ✓ 查询成功，返回 ${profitData.length} 条数据`);
            if (profitData.length > 0) {
                console.log('   前 10 条示例：');
                profitData.slice(0, 10).forEach((r, i) => {
                    console.log(`     ${i+1}. ${r.日期} | ${r.单号} | ${r.产品} | ${r.业务员 || '无'} | ${r.部门 || '无'}`);
                    console.log(`        报价=${Number(r.报价总金额||0).toFixed(2)} | 卖价=${Number(r.卖价总金额||0).toFixed(2)} | 利润=${Number(r.利润差额||0).toFixed(2)} | 利率=${Number(r.利率||0).toFixed(2)}%`);
                });
                
                const totalQuote = profitData.reduce((sum, r) => sum + Number(r.报价总金额||0), 0);
                const totalSell = profitData.reduce((sum, r) => sum + Number(r.卖价总金额||0), 0);
                const totalProfit = profitData.reduce((sum, r) => sum + Number(r.利润差额||0), 0);
                const avgRate = totalQuote > 0 ? (totalProfit / totalQuote * 100) : 0;
                console.log(`   汇总：总报价=${totalQuote.toFixed(2)} | 总卖价=${totalSell.toFixed(2)} | 总利润=${totalProfit.toFixed(2)} | 平均利率=${avgRate.toFixed(2)}%`);
            } else {
                console.log('   ⚠ 该日期范围内无数据');
            }
            results.push({ test: '利润统计 - 老厂新系统', status: '成功', rows: profitData.length });
        } else {
            results.push({ test: '利润统计 - 老厂新系统', status: '失败', rows: 0 });
        }
        await conn.close();
    }

    // ========== 测试 3: 验证关联字段是否正确 ==========
    console.log('\n\n【测试 3】验证关联字段');
    console.log('----------------------------------------');
    
    conn = await testConnection(DB_CONFIGS.新厂新系统);
    if (conn) {
        // 3.1 检查 ord_ct 表的 agntcde 字段数据
        console.log('\n3.1 检查 ord_ct.agntcde 与 pb_dept_member.mobile 的关联：');
        const joinTestSql = `
            SELECT t.agntcde, e.empnme, e.dept_cde, d.dept_nme
            FROM ord_ct t
            LEFT JOIN pb_dept_member e ON t.agntcde = e.mobile
            LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
            WHERE t.agntcde IS NOT NULL
              AND t.created >= TO_DATE('${TEST_DATE_FROM}', 'YYYY-MM-DD')
              AND t.created < TO_DATE('${TEST_DATE_TO}', 'YYYY-MM-DD')
            ORDER BY t.created
            FETCH FIRST 10 ROWS ONLY
        `;
        const joinData = await runQuery(conn, joinTestSql);
        if (joinData) {
            console.log(`   ✓ 关联查询成功，返回 ${joinData.length} 条数据`);
            joinData.forEach((r, i) => {
                console.log(`     ${i+1}. agntcde=${r.AGNTCDE} -> 业务员=${r.EMPNME || '未匹配'} | 部门编码=${r.DEPT_CDE || '无'} | 部门=${r.DEPT_NME || '无'}`);
            });
        }

        // 3.2 检查 pb_dept_member 表是否有数据
        console.log('\n3.2 检查 pb_dept_member 表数据：');
        const empSql = `SELECT mobile, empnme, dept_cde FROM pb_dept_member WHERE isactive='Y' AND ROWNUM <= 10`;
        const empData = await runQuery(conn, empSql);
        if (empData) {
            console.log(`   ✓ 查询成功，返回 ${empData.length} 条业务员数据`);
            empData.forEach((r, i) => {
                console.log(`     ${i+1}. mobile=${r.MOBILE} | empnme=${r.EMPNME} | dept_cde=${r.DEPT_CDE}`);
            });
        }

        await conn.close();
    }

    // ========== 测试结果汇总 ==========
    console.log('\n\n========================================');
    console.log('测试结果汇总');
    console.log('========================================');
    results.forEach(r => {
        const icon = r.status === '成功' ? '✓' : '✗';
        console.log(`${icon} ${r.test}: ${r.status} (${r.rows} 条数据)`);
    });

    console.log('\n========================================');
    console.log('测试完成！');
    console.log('========================================');
}

main().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
