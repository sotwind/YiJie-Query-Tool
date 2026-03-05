/**
 * 易捷查询 - 数据库表结构探索（查询所有 schema）
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

async function exploreAllSchemas(connection, dbName) {
    const result = {
        name: dbName,
        schemas: [],
        orderTables: []
    };

    // 1. 获取所有 schema
    console.log(`\n【${dbName}】获取所有 schema...`);
    try {
        const schemasResult = await connection.execute(
            `SELECT DISTINCT owner FROM all_tables ORDER BY owner`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        result.schemas = schemasResult.rows.map(r => r.OWNER);
        console.log(`  找到 ${result.schemas.length} 个 schema: ${result.schemas.join(', ')}`);
    } catch (err) {
        console.log(`  错误：${err.message}`);
        // 如果 all_tables 也查不了，尝试获取当前用户
        try {
            const userResult = await connection.execute(`SELECT user FROM dual`);
            console.log(`  当前用户：${userResult.rows[0][0]}`);
        } catch (e) {}
    }

    // 2. 在每个 schema 中查找订单相关表
    console.log(`\n【${dbName}】查找订单相关表...`);
    const searchPatterns = ['%ORD%', '%ORDER%', '%SALES%', '%BAS%', '%CT%'];
    
    for (const schema of result.schemas) {
        for (const pattern of searchPatterns) {
            try {
                const tablesResult = await connection.execute(
                    `SELECT table_name FROM all_tables 
                     WHERE owner = :schema AND table_name LIKE :pattern 
                     ORDER BY table_name`,
                    [schema, pattern],
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                
                if (tablesResult.rows.length > 0) {
                    const tableNames = tablesResult.rows.map(r => `${schema}.${r.TABLE_NAME}`);
                    console.log(`  ${schema} (匹配${pattern}): ${tableNames.join(', ')}`);
                    
                    for (const table of tablesResult.rows) {
                        result.orderTables.push({
                            schema: schema,
                            tableName: table.TABLE_NAME
                        });
                    }
                }
            } catch (err) {
                // 忽略
            }
        }
    }

    // 3. 检查特定表是否存在并获取结构
    console.log(`\n【${dbName}】检查关键表结构...`);
    const keyTables = [
        { schema: 'FERP', table: 'ORD_BAS' },
        { schema: 'FERP', table: 'ORD_CT' },
        { schema: 'FERP', table: 'PB_CLNT' },
        { schema: 'FERP', table: 'PB_DEPT' },
        { schema: 'FERP', table: 'PB_DEPT_MEMBER' },
        { schema: 'FERP', table: 'HR_BASE' },
        { schema: 'B0003', table: 'ORD_BAS' },
        { schema: 'B0003', table: 'ORD_CT' },
        { schema: 'READ', table: 'ORD_BAS' },
        { schema: 'READ', table: 'ORD_CT' },
    ];

    for (const { schema, table } of keyTables) {
        try {
            const existsResult = await connection.execute(
                `SELECT COUNT(*) as cnt FROM all_tables WHERE owner = :schema AND table_name = :table`,
                [schema, table],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (existsResult.rows[0].CNT > 0) {
                console.log(`  ✓ ${schema}.${table} 存在`);
                
                // 获取字段
                try {
                    const colsResult = await connection.execute(
                        `SELECT column_name, data_type FROM all_tab_columns 
                         WHERE owner = :schema AND table_name = :table 
                         ORDER BY column_id`,
                        [schema, table],
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );
                    
                    const columns = colsResult.rows.slice(0, 15).map(r => `${r.COLUMN_NAME}(${r.DATA_TYPE})`);
                    console.log(`    字段：${columns.join(', ')}${colsResult.rows.length > 15 ? '...' : ''}`);
                    
                    // 检查是否有 AGNTCDE 字段
                    const hasAgntcde = colsResult.rows.some(r => r.COLUMN_NAME === 'AGNTCDE');
                    const hasCreated = colsResult.rows.some(r => r.COLUMN_NAME === 'CREATED');
                    const hasSerial = colsResult.rows.some(r => r.COLUMN_NAME === 'SERIAL');
                    console.log(`    关键字段：AGNTCDE=${hasAgntcde ? '✓' : '✗'}, CREATED=${hasCreated ? '✓' : '✗'}, SERIAL=${hasSerial ? '✓' : '✗'}`);
                } catch (err) {
                    console.log(`    无法获取字段：${err.message}`);
                }
            }
        } catch (err) {
            // 忽略
        }
    }

    // 4. 尝试直接查询 FERP.ORD_BAS
    console.log(`\n【${dbName}】尝试查询 FERP.ORD_BAS...`);
    try {
        const countResult = await connection.execute(
            `SELECT COUNT(*) as cnt FROM FERP.ORD_BAS 
             WHERE created >= TO_DATE('2026-03-04', 'YYYY-MM-DD') 
             AND created < TO_DATE('2026-03-05', 'YYYY-MM-DD')`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`  ✓ 2026-03-04 数据：${countResult.rows[0].CNT} 条`);
        
        // 获取示例数据
        const sampleResult = await connection.execute(
            `SELECT serial, prdnme, accamt, created, agntcde FROM FERP.ORD_BAS 
             WHERE created >= TO_DATE('2026-03-04', 'YYYY-MM-DD') 
             AND created < TO_DATE('2026-03-05', 'YYYY-MM-DD')
             AND ROWNUM <= 5`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (sampleResult.rows.length > 0) {
            console.log(`  示例数据:`);
            sampleResult.rows.forEach(row => {
                console.log(`    单号=${row.SERIAL}, 产品=${row.PRDNME}, 金额=${row.ACCAMT}, 业务员=${row.AGNTCDE || '无'}`);
            });
        }
    } catch (err) {
        console.log(`  ✗ 查询失败：${err.message}`);
    }

    // 5. 尝试查询 FERP.ORD_CT
    console.log(`\n【${dbName}】尝试查询 FERP.ORD_CT...`);
    try {
        const countResult = await connection.execute(
            `SELECT COUNT(*) as cnt FROM FERP.ORD_CT 
             WHERE created >= TO_DATE('2026-03-04', 'YYYY-MM-DD') 
             AND created < TO_DATE('2026-03-05', 'YYYY-MM-DD')`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(`  ✓ 2026-03-04 数据：${countResult.rows[0].CNT} 条`);
        
        // 获取示例数据
        const sampleResult = await connection.execute(
            `SELECT serial, agntcde, asscde, acreage, ordnum FROM FERP.ORD_CT 
             WHERE created >= TO_DATE('2026-03-04', 'YYYY-MM-DD') 
             AND created < TO_DATE('2026-03-05', 'YYYY-MM-DD')
             AND ROWNUM <= 5`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (sampleResult.rows.length > 0) {
            console.log(`  示例数据:`);
            sampleResult.rows.forEach(row => {
                console.log(`    单号=${row.SERIAL}, 业务员=${row.AGNTCDE || '无'}, 跟单=${row.ASSCDE || '无'}, 面积=${row.ACREAGE}, 数量=${row.ORDNUM}`);
            });
        }
    } catch (err) {
        console.log(`  ✗ 查询失败：${err.message}`);
    }

    return result;
}

async function main() {
    console.log('========================================');
    console.log('易捷数据库表结构探索（所有 schema）');
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

            const schemaInfo = await exploreAllSchemas(connection, dbConfig.name);
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
    const outputFile = '/home/admin/.openclaw/workspace/YiJie-Query-Tool/explore_all_schemas_results.json';
    fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2));
    console.log(`\n\n✓ 详细结果已保存到：${outputFile}`);
}

main().catch(console.error);
