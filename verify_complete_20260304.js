/**
 * 易捷查询 - 完整数据库验证测试
 * 测试日期：2026-03-04（昨天）
 * 测试内容：检查所有子公司数据库的表结构，执行销售员图和利润统计 SQL
 */

const oracledb = require('oracledb');

// 启用 Thick 模式
try {
    oracledb.initOracleClient({ libDir: '' });
    console.log('✓ Oracle Thick 模式已启用\n');
} catch (err) {
    console.log('⚠ Oracle Thick 模式初始化失败，使用 Thin 模式:', err.message, '\n');
}

// 数据库连接配置 - 所有子公司
const DB_CONFIGS = [
    {
        name: '新厂新系统',
        user: 'b0003',
        password: 'kuke.b0003',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.134.7.141)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    {
        name: '老厂新系统',
        user: 'read',
        password: 'ejsh.read',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.132.30)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    {
        name: '温森新系统',
        user: 'read',
        password: 'ejsh.read',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=db.05.forestpacking.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    {
        name: '临海',
        user: 'read',
        password: 'ejsh.read',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.137.213.189)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    }
];

// 测试日期：2026-03-04（昨天）
const TEST_DATE_FROM = '2026-03-04';
const TEST_DATE_TO = '2026-03-05';

async function checkTableStructure(connection, dbName) {
    const tables = {
        ord_bas: false,
        ord_ct: false,
        pb_clnt: false,
        pb_dept: false,
        pb_dept_member: false,
        hr_base: false
    };
    
    const views = {
        V_ORD: false
    };
    
    // 检查表是否存在
    for (const tableName of Object.keys(tables)) {
        try {
            const result = await connection.execute(
                `SELECT COUNT(*) as cnt FROM user_tables WHERE table_name = UPPER(:tableName)`,
                [tableName]
            );
            if (result.rows[0].CNT > 0) {
                tables[tableName] = true;
            }
        } catch (err) {
            // 忽略错误
        }
    }
    
    // 检查视图
    try {
        const result = await connection.execute(
            `SELECT COUNT(*) as cnt FROM user_views WHERE view_name = 'V_ORD'`
        );
        if (result.rows[0].CNT > 0) {
            views.V_ORD = true;
        }
    } catch (err) {
        // 忽略错误
    }
    
    return { tables, views };
}

async function runSalesChartQuery(connection, dbName, hasOrdBas) {
    // 销售员图 SQL（来自窗体_销售员图.cs）
    // 基础 SQL - 按业务员统计
    const sql = `
        select b.objtyp, t.agntcde, 
               nvl(sum(b.accamt),0) as 金额，
               nvl(sum(t.acreage * t.ordnum),0) as 面积，
               count(*) as 单数 
        from ${hasOrdBas ? 'ord_bas b join ord_ct t on b.serial = t.serial' : 'V_ORD'}
        where isactive='Y'
          and created >= to_date(:dateFrom, 'yyyy-mm-dd')
          and created < to_date(:dateTo, 'yyyy-mm-dd')
        group by t.agntcde, b.objtyp
        order by t.agntcde
    `;
    
    try {
        const result = await connection.execute(sql, {
            dateFrom: TEST_DATE_FROM,
            dateTo: TEST_DATE_TO
        }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        return {
            status: 'success',
            rows: result.rows.length,
            data: result.rows
        };
    } catch (err) {
        return {
            status: `查询失败：${err.message}`,
            rows: 0,
            data: []
        };
    }
}

async function runProfitStatQuery(connection, dbName, hasOrdBas) {
    // 利润统计 SQL（来自窗体_利润统计.cs）
    const sql = `
        SELECT 
            TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
            b.serial as 单号，
            c.clntnme as 客户，
            b.prdnme as 产品，
            e.empnme as 业务员，
            d.dept_nme as 部门，
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
        LEFT JOIN pb_dept_member e ON t.agntcde = e.user_cde
        LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
        WHERE b.isactive = 'Y'
          AND b.created >= to_date(:dateFrom, 'yyyy-mm-dd')
          AND b.created < to_date(:dateTo, 'yyyy-mm-dd')
    `;
    
    try {
        const result = await connection.execute(sql, {
            dateFrom: TEST_DATE_FROM,
            dateTo: TEST_DATE_TO
        }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        return {
            status: 'success',
            rows: result.rows.length,
            data: result.rows
        };
    } catch (err) {
        return {
            status: `查询失败：${err.message}`,
            rows: 0,
            data: []
        };
    }
}

async function main() {
    console.log('========================================');
    console.log('易捷查询 - 完整数据库验证测试');
    console.log(`测试日期：${TEST_DATE_FROM}（昨天）`);
    console.log('========================================\n');

    const results = {
        timestamp: new Date().toISOString(),
        testDate: TEST_DATE_FROM,
        databases: []
    };

    for (const dbConfig of DB_CONFIGS) {
        console.log(`\n【${dbConfig.name}】=================================================`);
        
        let connection;
        try {
            connection = await oracledb.getConnection({
                user: dbConfig.user,
                password: dbConfig.password,
                connectString: dbConfig.connectString
            });
            console.log(`✓ 数据库连接成功`);
        } catch (err) {
            console.log(`✗ 数据库连接失败：${err.message}`);
            results.databases.push({
                name: dbConfig.name,
                status: '连接失败',
                error: err.message
            });
            continue;
        }

        const dbResult = {
            name: dbConfig.name,
            status: '连接成功',
            structure: {},
            salesChart: {},
            profitStats: {}
        };

        // 步骤 1: 检查表结构
        console.log('\n【表结构检查】');
        const structure = await checkTableStructure(connection, dbConfig.name);
        dbResult.structure = structure;
        
        console.log(`  表: ord_bas=${structure.tables.ord_bas ? '✓' : '✗'}, ord_ct=${structure.tables.ord_ct ? '✓' : '✗'}, pb_clnt=${structure.tables.pb_clnt ? '✓' : '✗'}`);
        console.log(`  表: pb_dept=${structure.tables.pb_dept ? '✓' : '✗'}, pb_dept_member=${structure.tables.pb_dept_member ? '✓' : '✗'}, hr_base=${structure.tables.hr_base ? '✓' : '✗'}`);
        console.log(`  视图：V_ORD=${structure.views.V_ORD ? '✓' : '✗'}`);

        // 步骤 2: 执行销售员图查询
        console.log('\n【销售员图查询】');
        const hasOrdBas = structure.tables.ord_bas && structure.tables.ord_ct;
        const salesResult = await runSalesChartQuery(connection, dbConfig.name, hasOrdBas);
        dbResult.salesChart = salesResult;
        
        if (salesResult.status === 'success') {
            console.log(`  ✓ 查询成功，返回 ${salesResult.rows} 条数据`);
            if (salesResult.rows > 0) {
                console.log(`  示例数据:`);
                salesResult.data.slice(0, 3).forEach(row => {
                    console.log(`    业务员=${row.AGNTCDE}, 产品类型=${row.OBJTYP}, 单数=${row.单数}, 金额=${row.金额}, 面积=${row.面积}`);
                });
                
                // 汇总统计
                const totalOrders = salesResult.data.reduce((sum, row) => sum + row.单数, 0);
                const totalAmount = salesResult.data.reduce((sum, row) => sum + parseFloat(row.金额), 0);
                const totalArea = salesResult.data.reduce((sum, row) => sum + parseFloat(row.面积), 0);
                console.log(`  汇总：总单数=${totalOrders}, 总金额=${totalAmount.toFixed(2)}, 总面积=${totalArea.toFixed(2)}`);
            } else {
                console.log(`  ⚠ 无数据返回（${TEST_DATE_FROM} 可能没有订单）`);
            }
        } else {
            console.log(`  ✗ ${salesResult.status}`);
        }

        // 步骤 3: 执行利润统计查询
        console.log('\n【利润统计查询】');
        if (hasOrdBas) {
            const profitResult = await runProfitStatQuery(connection, dbConfig.name, hasOrdBas);
            dbResult.profitStats = profitResult;
            
            if (profitResult.status === 'success') {
                console.log(`  ✓ 查询成功，返回 ${profitResult.rows} 条数据`);
                if (profitResult.rows > 0) {
                    console.log(`  示例数据:`);
                    profitResult.data.slice(0, 3).forEach(row => {
                        console.log(`    日期=${row.日期}, 单号=${row.单号}, 客户=${row.客户}, 业务员=${row.业务员 || '无'}, 部门=${row.部门 || '无'}, 卖价=${row.卖价总金额}, 利率=${row.利率}%`);
                    });
                    
                    // 汇总统计
                    const totalQuote = profitResult.data.reduce((sum, row) => sum + parseFloat(row.报价总金额), 0);
                    const totalSell = profitResult.data.reduce((sum, row) => sum + parseFloat(row.卖价总金额), 0);
                    const totalProfit = profitResult.data.reduce((sum, row) => sum + parseFloat(row.利润差额), 0);
                    const avgRate = totalQuote > 0 ? ((totalSell - totalQuote) / totalQuote * 100) : 0;
                    console.log(`  汇总：报价总额=${totalQuote.toFixed(2)}, 卖价总额=${totalSell.toFixed(2)}, 利润差额=${totalProfit.toFixed(2)}, 平均利率=${avgRate.toFixed(2)}%`);
                } else {
                    console.log(`  ⚠ 无数据返回（${TEST_DATE_FROM} 可能没有订单）`);
                }
            } else {
                console.log(`  ✗ ${profitResult.status}`);
            }
        } else {
            console.log(`  ⊘ 跳过（缺少 ord_bas 或 ord_ct 表）`);
            dbResult.profitStats = { status: '跳过 - 缺少表结构' };
        }

        results.databases.push(dbResult);
        await connection.close();
    }

    // 汇总所有数据库结果
    console.log('\n\n========================================');
    console.log('测试结果汇总');
    console.log('========================================');
    
    console.log('\n【销售员图】各子公司数据：');
    let totalSalesOrders = 0;
    let totalSalesAmount = 0;
    for (const db of results.databases) {
        if (db.salesChart.status === 'success') {
            const orders = db.salesChart.data.reduce((sum, row) => sum + row.单数, 0);
            const amount = db.salesChart.data.reduce((sum, row) => sum + parseFloat(row.金额), 0);
            console.log(`  ✓ ${db.name}: ${orders} 单，金额 ${amount.toFixed(2)}`);
            totalSalesOrders += orders;
            totalSalesAmount += amount;
        } else {
            console.log(`  ✗ ${db.name}: ${db.salesChart.status || '无数据'}`);
        }
    }
    console.log(`销售员图总计：${totalSalesOrders} 单，总金额 ${totalSalesAmount.toFixed(2)}`);

    console.log('\n【利润统计】各子公司数据：');
    let totalProfitOrders = 0;
    let totalQuoteAmount = 0;
    let totalSellAmount = 0;
    for (const db of results.databases) {
        if (db.profitStats.status === 'success') {
            const orders = db.profitStats.data.length;
            const quote = db.profitStats.data.reduce((sum, row) => sum + parseFloat(row.报价总金额), 0);
            const sell = db.profitStats.data.reduce((sum, row) => sum + parseFloat(row.卖价总金额), 0);
            console.log(`  ✓ ${db.name}: ${orders} 单，报价 ${quote.toFixed(2)}, 卖价 ${sell.toFixed(2)}`);
            totalProfitOrders += orders;
            totalQuoteAmount += quote;
            totalSellAmount += sell;
        } else {
            console.log(`  ✗ ${db.name}: ${db.profitStats.status || '无数据'}`);
        }
    }
    const totalProfit = totalSellAmount - totalQuoteAmount;
    const avgProfitRate = totalQuoteAmount > 0 ? (totalProfit / totalQuoteAmount * 100) : 0;
    console.log(`利润统计总计：${totalProfitOrders} 单，报价总额 ${totalQuoteAmount.toFixed(2)}, 卖价总额 ${totalSellAmount.toFixed(2)}, 利润 ${totalProfit.toFixed(2)}, 平均利率 ${avgProfitRate.toFixed(2)}%`);

    // 保存结果到文件
    const fs = require('fs');
    const outputFile = '/home/admin/.openclaw/workspace/YiJie-Query-Tool/verify_results_' + TEST_DATE_FROM + '_full.json';
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\n✓ 详细结果已保存到：${outputFile}`);
}

main().catch(console.error);
