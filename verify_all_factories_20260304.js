/**
 * 验证易捷查询 - 所有子公司数据库汇总测试
 * 测试日期：2026-03-04（昨天）
 * 测试内容：销售员图 SQL + 利润统计 SQL
 */

const oracledb = require('oracledb');

// 启用 Thick 模式支持旧版本数据库
try {
    oracledb.initOracleClient({ libDir: '' });
    console.log('✓ Oracle Thick 模式已启用\n');
} catch (err) {
    console.log('⚠ Oracle Thick 模式初始化失败，使用 Thin 模式:', err.message, '\n');
}

// 数据库连接配置 - 所有子公司
const DB_CONFIGS = {
    新厂新系统: {
        name: '新厂新系统',
        user: 'b0003',
        password: 'kuke.b0003',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.134.7.141)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    老厂新系统: {
        name: '老厂新系统',
        user: 'read',
        password: 'ejsh.read',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.132.30)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    温森新系统: {
        name: '温森新系统',
        user: 'read',
        password: 'ejsh.read',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=db.05.forestpacking.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    临海: {
        name: '临海',
        user: 'read',
        password: 'ejsh.read',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.137.213.189)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    }
};

// 易捷集团数据库（用于部门和业务员信息）
const YIJIE_GROUP = {
    name: '易捷集团',
    host: '36.138.130.91',
    port: 1521,
    service: 'dbms',
    user: 'fgrp',
    password: 'kuke.fgrp'
};

// 测试日期：2026-03-04（昨天）
const TEST_DATE_FROM = '2026-03-04';
const TEST_DATE_TO = '2026-03-05';

async function testConnection(dbConfig) {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
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
    console.log('易捷查询 - 所有子公司数据库验证测试');
    console.log(`测试日期：${TEST_DATE_FROM}（昨天）`);
    console.log('========================================\n');

    const allResults = {
        salesChart: [],
        profitStats: []
    };

    // ========== 测试 1: 销售员图 SQL（每个子公司数据库） ==========
    console.log('【测试 1】销售员图 SQL - 各子公司数据汇总');
    console.log('========================================\n');
    
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

    for (const [key, dbConfig] of Object.entries(DB_CONFIGS)) {
        console.log(`\n【${dbConfig.name}】`);
        console.log('----------------------------------------');
        
        const conn = await testConnection(dbConfig);
        if (conn) {
            try {
                // 检查表结构：ORD_BAS 或 V_ORD
                const tableCheck = await runQuery(conn, `
                    SELECT table_name FROM user_tables WHERE table_name = 'ORD_BAS'
                `);
                
                const viewCheck = await runQuery(conn, `
                    SELECT view_name FROM user_views WHERE view_name = 'V_ORD'
                `);
                
                const hasOrderData = (tableCheck && tableCheck.length > 0) || (viewCheck && viewCheck.length > 0);
                
                if (!hasOrderData) {
                    console.log('  ⚠ 该数据库没有 ORD_BAS 表或 V_ORD 视图，跳过');
                    allResults.salesChart.push({
                        factory: dbConfig.name,
                        status: '无订单数据表',
                        rows: 0,
                        data: []
                    });
                    await conn.close();
                    continue;
                }

                // 根据表结构调整 SQL
                let actualSalesSql = salesRepSql;
                if (viewCheck && viewCheck.length > 0) {
                    console.log('  ℹ 使用 V_ORD 视图查询');
                    // V_ORD 视图已经包含了聚合数据
                    actualSalesSql = `
                        SELECT objtyp, agntcde, 
                               nvl(sum(accamt),0) as 金额，
                               nvl(sum(acreage * ordnum),0) as 面积，
                               count(*) as 单数 
                        FROM v_ord 
                        WHERE status='Y'
                          AND ptdate >= TO_DATE('${TEST_DATE_FROM}', 'YYYY-MM-DD') 
                          AND ptdate < TO_DATE('${TEST_DATE_TO}', 'YYYY-MM-DD')
                        GROUP BY agntcde, objtyp 
                        ORDER BY agntcde
                    `;
                } else {
                    console.log('  ℹ 使用 ORD_BAS + ORD_CT 表查询');
                }

                const salesData = await runQuery(conn, actualSalesSql);
                if (salesData) {
                    console.log(`  ✓ 查询成功，返回 ${salesData.length} 条数据`);
                    
                    if (salesData.length > 0) {
                        // 汇总统计
                        const totalAmount = salesData.reduce((sum, r) => sum + Number(r.金额||0), 0);
                        const totalArea = salesData.reduce((sum, r) => sum + Number(r.面积||0), 0);
                        const totalOrders = salesData.reduce((sum, r) => sum + Number(r.单数||0), 0);
                        
                        console.log(`  汇总：总金额=${totalAmount.toFixed(2)} | 总面积=${totalArea.toFixed(2)} | 总单数=${totalOrders}`);
                        console.log('  前 5 条示例：');
                        salesData.slice(0, 5).forEach((r, i) => {
                            console.log(`    ${i+1}. 业务员=${r.AGNTCDE || '无'} | 产品类型=${r.OBJTYP} | 金额=${Number(r.金额||0).toFixed(2)} | 面积=${Number(r.面积||0).toFixed(2)} | 单数=${r.单数}`);
                        });
                    } else {
                        console.log('  ⚠ 该日期范围内无数据');
                    }
                    
                    allResults.salesChart.push({
                        factory: dbConfig.name,
                        status: '成功',
                        rows: salesData.length,
                        data: salesData
                    });
                } else {
                    allResults.salesChart.push({
                        factory: dbConfig.name,
                        status: '查询失败',
                        rows: 0,
                        data: []
                    });
                }
            } catch (err) {
                console.log(`  ✗ 查询异常：${err.message}`);
                allResults.salesChart.push({
                    factory: dbConfig.name,
                    status: `异常：${err.message}`,
                    rows: 0,
                    data: []
                });
            }
            await conn.close();
        }
    }

    // ========== 测试 2: 利润统计 SQL（每个子公司数据库） ==========
    console.log('\n\n【测试 2】利润统计 SQL - 各子公司数据汇总');
    console.log('========================================\n');
    
    // 利润统计 SQL（来自窗体_利润统计.cs）
    const profitSql = `
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    b.objtyp as 产品类型，
    nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 报价总金额，
    nvl(b.accamt, 0) as 卖价总金额，
    nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 利润差额，
    case 
        when nvl(b.quoprc, 0) * nvl(b.accnum, 0) = 0 then 0
        else (nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) / (nvl(b.quoprc, 0) * nvl(b.accnum, 0)) * 100
    end as 利率
FROM ord_bas b
LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
WHERE b.isactive = 'Y'
  AND b.created >= TO_DATE('${TEST_DATE_FROM}', 'YYYY-MM-DD')
  AND b.created < TO_DATE('${TEST_DATE_TO}', 'YYYY-MM-DD')
ORDER BY b.created
    `;

    for (const [key, dbConfig] of Object.entries(DB_CONFIGS)) {
        console.log(`\n【${dbConfig.name}】`);
        console.log('----------------------------------------');
        
        const conn = await testConnection(dbConfig);
        if (conn) {
            try {
                // 检查表结构：ORD_BAS 或 V_ORD
                const tableCheck = await runQuery(conn, `
                    SELECT table_name FROM user_tables WHERE table_name = 'ORD_BAS'
                `);
                
                const viewCheck = await runQuery(conn, `
                    SELECT view_name FROM user_views WHERE view_name = 'V_ORD'
                `);
                
                const hasOrderData = (tableCheck && tableCheck.length > 0) || (viewCheck && viewCheck.length > 0);
                
                if (!hasOrderData) {
                    console.log('  ⚠ 该数据库没有 ORD_BAS 表或 V_ORD 视图，跳过');
                    allResults.profitStats.push({
                        factory: dbConfig.name,
                        status: '无订单数据表',
                        rows: 0,
                        data: []
                    });
                    await conn.close();
                    continue;
                }

                // 根据表结构调整 SQL
                let actualProfitSql = profitSql;
                if (viewCheck && viewCheck.length > 0) {
                    console.log('  ℹ 使用 V_ORD 视图查询');
                    actualProfitSql = `
SELECT 
    TO_CHAR(ptdate, 'yyyy-MM-dd') as 日期，
    serial as 单号，
    clntcde as 客户代码，
    '' as 产品，
    objtyp as 产品类型，
    nvl(quoprc, 0) * nvl(accnum, 0) as 报价总金额，
    nvl(accamt, 0) as 卖价总金额，
    nvl(accamt, 0) - nvl(quoprc, 0) * nvl(accnum, 0) as 利润差额，
    case 
        when nvl(quoprc, 0) * nvl(accnum, 0) = 0 then 0
        else (nvl(accamt, 0) - nvl(quoprc, 0) * nvl(accnum, 0)) / (nvl(quoprc, 0) * nvl(accnum, 0)) * 100
    end as 利率
FROM v_ord
WHERE status = 'Y'
  AND ptdate >= TO_DATE('${TEST_DATE_FROM}', 'YYYY-MM-DD')
  AND ptdate < TO_DATE('${TEST_DATE_TO}', 'YYYY-MM-DD')
ORDER BY ptdate
                    `;
                } else {
                    console.log('  ℹ 使用 ORD_BAS 表查询');
                }

                const profitData = await runQuery(conn, actualProfitSql);
                if (profitData) {
                    console.log(`  ✓ 查询成功，返回 ${profitData.length} 条数据`);
                    
                    if (profitData.length > 0) {
                        // 汇总统计
                        const totalQuote = profitData.reduce((sum, r) => sum + Number(r.报价总金额||0), 0);
                        const totalSell = profitData.reduce((sum, r) => sum + Number(r.卖价总金额||0), 0);
                        const totalProfit = profitData.reduce((sum, r) => sum + Number(r.利润差额||0), 0);
                        const avgRate = totalQuote > 0 ? (totalProfit / totalQuote * 100) : 0;
                        
                        console.log(`  汇总：总报价=${totalQuote.toFixed(2)} | 总卖价=${totalSell.toFixed(2)} | 总利润=${totalProfit.toFixed(2)} | 平均利率=${avgRate.toFixed(2)}%`);
                        console.log('  前 5 条示例：');
                        profitData.slice(0, 5).forEach((r, i) => {
                            console.log(`    ${i+1}. ${r.日期} | ${r.单号} | ${r.产品} | 报价=${Number(r.报价总金额||0).toFixed(2)} | 卖价=${Number(r.卖价总金额||0).toFixed(2)} | 利润=${Number(r.利润差额||0).toFixed(2)}`);
                        });
                    } else {
                        console.log('  ⚠ 该日期范围内无数据');
                    }
                    
                    allResults.profitStats.push({
                        factory: dbConfig.name,
                        status: '成功',
                        rows: profitData.length,
                        data: profitData
                    });
                } else {
                    allResults.profitStats.push({
                        factory: dbConfig.name,
                        status: '查询失败',
                        rows: 0,
                        data: []
                    });
                }
            } catch (err) {
                console.log(`  ✗ 查询异常：${err.message}`);
                allResults.profitStats.push({
                    factory: dbConfig.name,
                    status: `异常：${err.message}`,
                    rows: 0,
                    data: []
                });
            }
            await conn.close();
        }
    }

    // ========== 测试结果汇总 ==========
    console.log('\n\n========================================');
    console.log('测试结果汇总');
    console.log('========================================');
    
    console.log('\n【销售员图】各子公司数据：');
    let totalSalesRows = 0;
    allResults.salesChart.forEach(r => {
        const icon = r.status === '成功' ? '✓' : (r.status.includes('无 ORD_BAS') ? '○' : '✗');
        console.log(`${icon} ${r.factory}: ${r.status} (${r.rows} 条数据)`);
        totalSalesRows += r.rows;
    });
    console.log(`\n销售员图总计：${totalSalesRows} 条数据`);

    console.log('\n【利润统计】各子公司数据：');
    let totalProfitRows = 0;
    allResults.profitStats.forEach(r => {
        const icon = r.status === '成功' ? '✓' : (r.status.includes('无 ORD_BAS') ? '○' : '✗');
        console.log(`${icon} ${r.factory}: ${r.status} (${r.rows} 条数据)`);
        totalProfitRows += r.rows;
    });
    console.log(`\n利润统计总计：${totalProfitRows} 条数据`);

    // ========== 保存结果到 JSON 文件 ==========
    const fs = require('fs');
    const outputPath = '/home/admin/.openclaw/workspace/YiJie-Query-Tool/verify_results_20260304.json';
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
    console.log(`\n✓ 详细结果已保存到：${outputPath}`);

    console.log('\n========================================');
    console.log('测试完成！');
    console.log('========================================');
}

main().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
