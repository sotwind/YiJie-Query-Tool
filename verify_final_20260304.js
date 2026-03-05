/**
 * 易捷查询 - 完整验证测试（修正版）
 * 测试日期：2026-03-04（昨天）
 */

const oracledb = require('oracledb');
const fs = require('fs');

const DB_CONFIGS = [
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
    }
];

const TEST_DATE_FROM = '2026-03-04';
const TEST_DATE_TO = '2026-03-05';

async function main() {
    console.log('========================================');
    console.log('易捷查询 - 完整验证测试');
    console.log(`测试日期：${TEST_DATE_FROM}`);
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
            console.log(`✓ 数据库连接成功\n`);
        } catch (err) {
            console.log(`✗ 数据库连接失败：${err.message}\n`);
            results.databases.push({ name: dbConfig.name, status: '连接失败', error: err.message });
            continue;
        }

        const dbResult = { name: dbConfig.name, status: '连接成功' };

        // 步骤 1: 检查 ORD_BAS 表结构
        console.log('【步骤 1】检查 ORD_BAS 表结构...');
        try {
            const colsResult = await connection.execute(
                `SELECT column_name FROM all_tab_columns 
                 WHERE owner = 'FERP' AND table_name = 'ORD_BAS' 
                 ORDER BY column_id`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const columns = colsResult.rows.map(r => r.COLUMN_NAME);
            console.log(`  字段数：${columns.length}`);
            console.log(`  关键字段检查:`);
            console.log(`    CREATED: ${columns.includes('CREATED') ? '✓' : '✗'}`);
            console.log(`    SERIAL: ${columns.includes('SERIAL') ? '✓' : '✗'}`);
            console.log(`    ACCAMT: ${columns.includes('ACCAMT') ? '✓' : '✗'}`);
            console.log(`    QUOPRC: ${columns.includes('QUOPRC') ? '✓' : '✗'}`);
            console.log(`    ACCNUM: ${columns.includes('ACCNUM') ? '✓' : '✗'}`);
            console.log(`    ISACTIVE: ${columns.includes('ISACTIVE') ? '✓' : '✗'}`);
            console.log(`    CLNTCDE: ${columns.includes('CLNTCDE') ? '✓' : '✗'}`);
            console.log(`    PRDNME: ${columns.includes('PRDNME') ? '✓' : '✗'}`);
            console.log(`    OBJTYP: ${columns.includes('OBJTYP') ? '✓' : '✗'}`);
            dbResult.hasOrdBas = columns.includes('CREATED');
        } catch (err) {
            console.log(`  ✗ 错误：${err.message}`);
            dbResult.hasOrdBas = false;
        }

        // 步骤 2: 检查 ORD_CT 表结构
        console.log('\n【步骤 2】检查 ORD_CT 表结构...');
        try {
            const colsResult = await connection.execute(
                `SELECT column_name FROM all_tab_columns 
                 WHERE owner = 'FERP' AND table_name = 'ORD_CT' 
                 ORDER BY column_id`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const columns = colsResult.rows.map(r => r.COLUMN_NAME);
            console.log(`  字段数：${columns.length}`);
            console.log(`  关键字段检查:`);
            console.log(`    CREATED: ${columns.includes('CREATED') ? '✓' : '✗'}`);
            console.log(`    SERIAL: ${columns.includes('SERIAL') ? '✓' : '✗'}`);
            console.log(`    ACREAGE: ${columns.includes('ACREAGE') ? '✓' : '✗'}`);
            console.log(`    ORDNUM: ${columns.includes('ORDNUM') ? '✓' : '✗'}`);
            console.log(`    AGNTCDE: ${columns.includes('AGNTCDE') ? '✓' : '✗'}`);
            console.log(`    ASSCDE: ${columns.includes('ASSCDE') ? '✓' : '✗'}`);
            console.log(`    ISACTIVE: ${columns.includes('ISACTIVE') ? '✓' : '✗'}`);
            dbResult.hasOrdCt = columns.includes('CREATED');
            dbResult.hasAgntcde = columns.includes('AGNTCDE');
            dbResult.hasAsscde = columns.includes('ASSCDE');
        } catch (err) {
            console.log(`  ✗ 错误：${err.message}`);
            dbResult.hasOrdCt = false;
        }

        // 步骤 3: 检查 PB_CLNT 表
        console.log('\n【步骤 3】检查 PB_CLNT 表...');
        try {
            const colsResult = await connection.execute(
                `SELECT column_name FROM all_tab_columns 
                 WHERE owner = 'FERP' AND table_name = 'PB_CLNT' 
                 ORDER BY column_id`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const columns = colsResult.rows.map(r => r.COLUMN_NAME);
            console.log(`  关键字段：CLNTCDE=${columns.includes('CLNTCDE') ? '✓' : '✗'}, CLNTNME=${columns.includes('CLNTNME') ? '✓' : '✗'}`);
            dbResult.hasPbClnt = columns.includes('CLNTCDE');
        } catch (err) {
            console.log(`  ✗ 错误：${err.message}`);
            dbResult.hasPbClnt = false;
        }

        // 步骤 4: 检查部门/业务员表
        console.log('\n【步骤 4】检查部门/业务员表...');
        const deptTables = ['PB_DEPT', 'PB_DEPT_MEMBER', 'HR_BASE', 'PB_EMPS'];
        for (const tableName of deptTables) {
            try {
                const existsResult = await connection.execute(
                    `SELECT COUNT(*) as cnt FROM all_tables WHERE owner = 'FERP' AND table_name = :t`,
                    [tableName],
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                if (existsResult.rows[0].CNT > 0) {
                    console.log(`  ✓ FERP.${tableName} 存在`);
                    
                    // 获取字段
                    const colsResult = await connection.execute(
                        `SELECT column_name FROM all_tab_columns 
                         WHERE owner = 'FERP' AND table_name = :t AND column_id <= 8`,
                        [tableName],
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );
                    const fields = colsResult.rows.map(r => r.COLUMN_NAME).join(', ');
                    console.log(`    字段：${fields}...`);
                }
            } catch (err) {}
        }

        // 步骤 5: 执行销售员图查询
        console.log('\n【步骤 5】销售员图查询测试...');
        if (dbResult.hasOrdBas && dbResult.hasOrdCt) {
            // 先确定使用哪个字段作为业务员
            const salesField = dbResult.hasAgntcde ? 't.agntcde' : (dbResult.hasAsscde ? 't.asscde' : 'null');
            
            const salesSql = `
                SELECT ${salesField} as agntcde, b.objtyp,
                       nvl(sum(b.accamt),0) as 金额，
                       nvl(sum(t.acreage * nvl(t.ordnum,0)),0) as 面积，
                       count(*) as 单数
                FROM FERP.ORD_BAS b
                INNER JOIN FERP.ORD_CT t ON b.serial = t.serial
                WHERE b.isactive='Y'
                  AND b.created >= to_date(:dateFrom, 'yyyy-mm-dd')
                  AND b.created < to_date(:dateTo, 'yyyy-mm-dd')
                GROUP BY ${salesField}, b.objtyp
                ORDER BY ${salesField}
            `;
            
            try {
                const result = await connection.execute(salesSql, {
                    dateFrom: TEST_DATE_FROM,
                    dateTo: TEST_DATE_TO
                }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
                
                console.log(`  ✓ 查询成功，返回 ${result.rows.length} 条数据`);
                
                if (result.rows.length > 0) {
                    const totalOrders = result.rows.reduce((sum, r) => sum + r.单数, 0);
                    const totalAmount = result.rows.reduce((sum, r) => sum + parseFloat(r.金额), 0);
                    const totalArea = result.rows.reduce((sum, r) => sum + parseFloat(r.面积), 0);
                    console.log(`  汇总：总单数=${totalOrders}, 总金额=${totalAmount.toFixed(2)}, 总面积=${totalArea.toFixed(2)}`);
                    
                    console.log(`  前 5 条数据:`);
                    result.rows.slice(0, 5).forEach(row => {
                        console.log(`    业务员=${row.AGNTCDE || '无'}, 类型=${row.OBJTYP}, 单数=${row.单数}, 金额=${row.金额}`);
                    });
                    
                    dbResult.salesChart = {
                        status: 'success',
                        rows: result.rows.length,
                        totalOrders,
                        totalAmount,
                        totalArea,
                        sampleData: result.rows.slice(0, 5)
                    };
                } else {
                    console.log(`  ⚠ 无数据（${TEST_DATE_FROM} 可能没有订单）`);
                    dbResult.salesChart = { status: 'no_data', rows: 0 };
                }
            } catch (err) {
                console.log(`  ✗ 查询失败：${err.message}`);
                dbResult.salesChart = { status: 'error', error: err.message };
            }
        } else {
            console.log(`  ⊘ 跳过（缺少表结构）`);
            dbResult.salesChart = { status: 'skipped' };
        }

        // 步骤 6: 执行利润统计查询
        console.log('\n【步骤 6】利润统计查询测试...');
        if (dbResult.hasOrdBas && dbResult.hasOrdCt && dbResult.hasPbClnt) {
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
                FROM FERP.ORD_BAS b
                LEFT JOIN FERP.PB_CLNT c ON b.clntcde = c.clntcde
                WHERE b.isactive = 'Y'
                  AND b.created >= to_date(:dateFrom, 'yyyy-mm-dd')
                  AND b.created < to_date(:dateTo, 'yyyy-mm-dd')
            `;
            
            try {
                const result = await connection.execute(profitSql, {
                    dateFrom: TEST_DATE_FROM,
                    dateTo: TEST_DATE_TO
                }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
                
                console.log(`  ✓ 查询成功，返回 ${result.rows.length} 条数据`);
                
                if (result.rows.length > 0) {
                    const totalQuote = result.rows.reduce((sum, r) => sum + parseFloat(r.报价总金额), 0);
                    const totalSell = result.rows.reduce((sum, r) => sum + parseFloat(r.卖价总金额), 0);
                    const totalProfit = result.rows.reduce((sum, r) => sum + parseFloat(r.利润差额), 0);
                    const avgRate = totalQuote > 0 ? ((totalProfit / totalQuote) * 100) : 0;
                    
                    console.log(`  汇总：报价总额=${totalQuote.toFixed(2)}, 卖价总额=${totalSell.toFixed(2)}, 利润=${totalProfit.toFixed(2)}, 平均利率=${avgRate.toFixed(2)}%`);
                    
                    console.log(`  前 5 条数据:`);
                    result.rows.slice(0, 5).forEach(row => {
                        console.log(`    日期=${row.日期}, 单号=${row.单号}, 客户=${row.客户}, 产品=${row.产品}, 卖价=${row.卖价总金额}, 利率=${row.利率}%`);
                    });
                    
                    dbResult.profitStats = {
                        status: 'success',
                        rows: result.rows.length,
                        totalQuote,
                        totalSell,
                        totalProfit,
                        avgRate,
                        sampleData: result.rows.slice(0, 5)
                    };
                } else {
                    console.log(`  ⚠ 无数据`);
                    dbResult.profitStats = { status: 'no_data', rows: 0 };
                }
            } catch (err) {
                console.log(`  ✗ 查询失败：${err.message}`);
                dbResult.profitStats = { status: 'error', error: err.message };
            }
        } else {
            console.log(`  ⊘ 跳过（缺少表结构）`);
            dbResult.profitStats = { status: 'skipped' };
        }

        results.databases.push(dbResult);
        await connection.close();
    }

    // 汇总报告
    console.log('\n\n========================================');
    console.log('测试结果汇总');
    console.log('========================================');
    
    console.log('\n【销售员图】各子公司数据：');
    let grandTotalOrders = 0;
    let grandTotalAmount = 0;
    for (const db of results.databases) {
        if (db.salesChart?.status === 'success') {
            console.log(`  ✓ ${db.name}: ${db.salesChart.totalOrders} 单，金额 ${db.salesChart.totalAmount.toFixed(2)}`);
            grandTotalOrders += db.salesChart.totalOrders;
            grandTotalAmount += db.salesChart.totalAmount;
        } else if (db.salesChart?.status === 'no_data') {
            console.log(`  ⊘ ${db.name}: 无数据 (${TEST_DATE_FROM})`);
        } else {
            console.log(`  ✗ ${db.name}: ${db.salesChart?.status || db.salesChart?.error || '未知'}`);
        }
    }
    console.log(`\n销售员图总计：${grandTotalOrders} 单，总金额 ${grandTotalAmount.toFixed(2)}`);

    console.log('\n【利润统计】各子公司数据：');
    let grandTotalQuote = 0;
    let grandTotalSell = 0;
    for (const db of results.databases) {
        if (db.profitStats?.status === 'success') {
            console.log(`  ✓ ${db.name}: ${db.profitStats.rows} 单，报价 ${db.profitStats.totalQuote.toFixed(2)}, 卖价 ${db.profitStats.totalSell.toFixed(2)}, 利率 ${db.profitStats.avgRate.toFixed(2)}%`);
            grandTotalQuote += db.profitStats.totalQuote;
            grandTotalSell += db.profitStats.totalSell;
        } else if (db.profitStats?.status === 'no_data') {
            console.log(`  ⊘ ${db.name}: 无数据`);
        } else {
            console.log(`  ✗ ${db.name}: ${db.profitStats?.status || db.profitStats?.error || '未知'}`);
        }
    }
    const grandTotalProfit = grandTotalSell - grandTotalQuote;
    const grandAvgRate = grandTotalQuote > 0 ? ((grandTotalProfit / grandTotalQuote) * 100) : 0;
    console.log(`\n利润统计总计：报价总额 ${grandTotalQuote.toFixed(2)}, 卖价总额 ${grandTotalSell.toFixed(2)}, 利润 ${grandTotalProfit.toFixed(2)}, 平均利率 ${grandAvgRate.toFixed(2)}%`);

    // 保存结果
    const outputFile = `/home/admin/.openclaw/workspace/YiJie-Query-Tool/verify_final_${TEST_DATE_FROM}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\n✓ 详细结果已保存到：${outputFile}`);
}

main().catch(console.error);
