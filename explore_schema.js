/**
 * 易捷查询 - 数据库表结构探索
 * 目的：找出每个数据库的实际表结构
 */

const oracledb = require('oracledb');
const fs = require('fs');

// 使用 Thin 模式（不需要 Oracle 客户端）
console.log('使用 Oracle Thin 模式\n');

// 数据库连接配置
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

async function exploreSchema(connection, dbName) {
    const result = {
        name: dbName,
        tables: [],
        views: [],
        orderTables: [],
        sampleData: {}
    };

    // 1. 获取所有表
    console.log(`\n【${dbName}】获取所有表...`);
    try {
        const tablesResult = await connection.execute(
            `SELECT table_name FROM user_tables ORDER BY table_name`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        result.tables = tablesResult.rows.map(r => r.TABLE_NAME);
        console.log(`  找到 ${result.tables.length} 个表`);
        
        // 查找订单相关表
        result.orderTables = result.tables.filter(t => 
            t.toUpperCase().includes('ORD') || 
            t.toUpperCase().includes('ORDER') ||
            t.toUpperCase().includes('SALES')
        );
        console.log(`  订单相关表：${result.orderTables.join(', ') || '无'}`);
    } catch (err) {
        console.log(`  错误：${err.message}`);
    }

    // 2. 获取所有视图
    console.log(`\n【${dbName}】获取所有视图...`);
    try {
        const viewsResult = await connection.execute(
            `SELECT view_name FROM user_views ORDER BY view_name`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        result.views = viewsResult.rows.map(r => r.VIEW_NAME);
        console.log(`  找到 ${result.views.length} 个视图`);
    } catch (err) {
        console.log(`  错误：${err.message}`);
    }

    // 3. 检查可能的订单表结构
    const possibleOrderTables = ['ORD_BAS', 'ORD_CT', 'ORDERS', 'SALES_ORDER', 'T_ORD', 'V_ORD'];
    for (const tableName of possibleOrderTables) {
        try {
            const colsResult = await connection.execute(
                `SELECT column_name, data_type FROM user_tab_columns WHERE table_name = UPPER(:tableName) ORDER BY column_id`,
                [tableName],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (colsResult.rows.length > 0) {
                console.log(`\n✓ 表 ${tableName} 存在，字段:`);
                const columns = colsResult.rows.map(r => `${r.COLUMN_NAME}(${r.DATA_TYPE})`);
                console.log(`  ${columns.slice(0, 20).join(', ')}${columns.length > 20 ? '...' : ''}`);
                
                // 获取示例数据
                try {
                    const sampleResult = await connection.execute(
                        `SELECT * FROM ${tableName} WHERE ROWNUM <= 3`,
                        [],
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );
                    result.sampleData[tableName] = {
                        columns: colsResult.rows.map(r => r.COLUMN_NAME),
                        sampleRows: sampleResult.rows
                    };
                    console.log(`  示例数据：${sampleResult.rows.length} 条`);
                } catch (err) {
                    console.log(`  无法获取示例数据：${err.message}`);
                }
            }
        } catch (err) {
            // 表不存在
        }
    }

    // 4. 检查客户表
    console.log(`\n【${dbName}】检查客户表...`);
    const possibleClientTables = ['PB_CLNT', 'CUSTOMER', 'CLIENT', 'T_CLNT'];
    for (const tableName of possibleClientTables) {
        try {
            const colsResult = await connection.execute(
                `SELECT COUNT(*) as cnt FROM user_tables WHERE table_name = UPPER(:tableName)`,
                [tableName]
            );
            if (colsResult.rows[0].CNT > 0) {
                console.log(`  ✓ ${tableName} 存在`);
            }
        } catch (err) {}
    }

    // 5. 检查部门/业务员表
    console.log(`\n【${dbName}】检查部门/业务员表...`);
    const possibleDeptTables = ['PB_DEPT', 'PB_DEPT_MEMBER', 'PB_EMPS', 'HR_BASE', 'DEPARTMENT', 'EMPLOYEE'];
    for (const tableName of possibleDeptTables) {
        try {
            const colsResult = await connection.execute(
                `SELECT COUNT(*) as cnt FROM user_tables WHERE table_name = UPPER(:tableName)`,
                [tableName]
            );
            if (colsResult.rows[0].CNT > 0) {
                console.log(`  ✓ ${tableName} 存在`);
                
                // 获取字段
                try {
                    const fieldsResult = await connection.execute(
                        `SELECT column_name FROM user_tab_columns WHERE table_name = UPPER(:tableName) AND column_id <= 10`,
                        [],
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );
                    const fields = fieldsResult.rows.map(r => r.COLUMN_NAME).join(', ');
                    console.log(`    字段：${fields}...`);
                } catch (err) {}
            }
        } catch (err) {}
    }

    // 6. 检查是否有昨天 (2026-03-04) 的数据
    console.log(`\n【${dbName}】检查 2026-03-04 订单数据...`);
    for (const tableName of result.orderTables) {
        try {
            // 先检查是否有 CREATED 或类似日期字段
            const colsResult = await connection.execute(
                `SELECT column_name, data_type FROM user_tab_columns 
                 WHERE table_name = UPPER(:tableName) 
                 AND (column_name LIKE '%DATE%' OR column_name LIKE '%TIME%' OR column_name = 'CREATED' OR column_name = 'UPDATED')`,
                [tableName],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (colsResult.rows.length > 0) {
                const dateField = colsResult.rows[0].COLUMN_NAME;
                const countResult = await connection.execute(
                    `SELECT COUNT(*) as cnt FROM ${tableName} 
                     WHERE ${dateField} >= TO_DATE('2026-03-04', 'YYYY-MM-DD') 
                     AND ${dateField} < TO_DATE('2026-03-05', 'YYYY-MM-DD')`,
                    [],
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                console.log(`  ${tableName} (${dateField}): ${countResult.rows[0].CNT} 条记录`);
            }
        } catch (err) {
            // 忽略
        }
    }

    return result;
}

async function main() {
    console.log('========================================');
    console.log('易捷数据库表结构探索');
    console.log('========================================\n');

    const allResults = [];

    for (const dbConfig of DB_CONFIGS) {
        let connection;
        try {
            console.log(`\n========== 连接 ${dbConfig.name} ==========`);
            connection = await oracledb.getConnection({
                user: dbConfig.user,
                password: dbConfig.password,
                connectString: dbConfig.connectString
            });
            console.log(`✓ 连接成功`);

            const schemaInfo = await exploreSchema(connection, dbConfig.name);
            allResults.push(schemaInfo);

            await connection.close();
        } catch (err) {
            console.log(`✗ 连接失败：${err.message}`);
            allResults.push({
                name: dbConfig.name,
                error: err.message
            });
        }
    }

    // 保存结果
    const outputFile = '/home/admin/.openclaw/workspace/YiJie-Query-Tool/explore_schema_results.json';
    fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2));
    console.log(`\n\n✓ 详细结果已保存到：${outputFile}`);
}

main().catch(console.error);
