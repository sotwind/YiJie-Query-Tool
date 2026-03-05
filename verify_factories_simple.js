/**
 * 验证易捷查询 - 简单版数据库探索
 * 测试日期：2026-03-04（昨天）
 * 目标：找出每个数据库的订单表结构
 */

const oracledb = require('oracledb');
const fs = require('fs');

// 数据库连接配置
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

async function exploreDatabase(dbConfig) {
    let connection;
    try {
        console.log(`\n【${dbConfig.name}】`);
        console.log('='.repeat(50));
        
        connection = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        });
        
        console.log(`✓ 连接成功`);
        
        const result = {
            factory: dbConfig.name,
            connected: true,
            tables: [],
            views: [],
            orderTables: [],
            sampleData: null
        };
        
        // 1. 查询所有表（前 30 个）- 使用 all_tables 查看可访问的所有表
        console.log('\n1. 表列表（前 30 个）:');
        const tables = await connection.execute(
            `SELECT table_name, owner FROM all_tables WHERE owner IN (SELECT username FROM user_users) ORDER BY table_name`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        result.tables = tables.rows.map(r => r.TABLE_NAME);
        console.log(`   当前用户表：共 ${result.tables.length} 个`);
        console.log(`   前 30 个：${result.tables.slice(0, 30).join(', ') || '无'}`);
        
        // 查询 FERP schema 下的表
        console.log('\n1b. FERP schema 下的表（前 30 个）:');
        const ferpTables = await connection.execute(
            `SELECT table_name FROM all_tables WHERE owner = 'FERP' AND ROWNUM <= 30 ORDER BY table_name`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const ferpTableList = ferpTables.rows.map(r => r.TABLE_NAME);
        console.log(`   共 ${ferpTableList.length} 个表`);
        console.log(`   前 30 个：${ferpTableList.join(', ')}`);
        
        // 2. 查询订单相关表（FERP schema）
        console.log('\n2. 订单相关表 (FERP):');
        const orderTables = await connection.execute(
            `SELECT table_name FROM all_tables WHERE owner = 'FERP' AND (table_name LIKE '%ORD%' OR table_name LIKE '%MK%' OR table_name LIKE '%PRC%') ORDER BY table_name`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        result.orderTables = orderTables.rows.map(r => r.TABLE_NAME);
        console.log(`   ${result.orderTables.join(', ') || '无'}`);
        
        // 3. 查询视图（当前用户）
        console.log('\n3. 视图列表:');
        const views = await connection.execute(
            `SELECT view_name, owner FROM all_views WHERE owner IN (SELECT username FROM user_users) ORDER BY view_name`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        result.views = views.rows.map(r => r.VIEW_NAME);
        const vOrdExists = result.views.includes('V_ORD');
        console.log(`   当前用户视图：共 ${result.views.length} 个`);
        console.log(`   V_ORD 视图：${vOrdExists ? '✓ 存在' : '✗ 不存在'}`);
        
        // 查询 FERP schema 下的视图
        console.log('\n3b. FERP schema 下的视图:');
        const ferpViews = await connection.execute(
            `SELECT view_name FROM all_views WHERE owner = 'FERP' AND view_name = 'V_ORD'`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const vOrdInFerp = ferpViews.rows.length > 0;
        console.log(`   FERP.V_ORD 视图：${vOrdInFerp ? '✓ 存在' : '✗ 不存在'}`);
        
        // 4. 如果有 V_ORD，查询示例数据
        if (vOrdExists) {
            console.log('\n4. V_ORD 视图示例数据:');
            const sample = await connection.execute(
                `SELECT * FROM v_ord WHERE ROWNUM <= 3`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            result.sampleData = {
                view: 'V_ORD',
                columns: sample.metaData.map(m => m.name),
                rows: sample.rows
            };
            console.log(`   列：${result.sampleData.columns.join(', ')}`);
            console.log(`   前 3 条:`);
            sample.rows.forEach((row, i) => {
                console.log(`     [${i+1}] ${JSON.stringify(row)}`);
            });
        }
        
        // 5. 如果有 ORD_CT，查询示例数据
        if (result.orderTables.includes('ORD_CT')) {
            console.log('\n5. ORD_CT 表示例数据:');
            const sample = await connection.execute(
                `SELECT * FROM ord_ct WHERE ROWNUM <= 3`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            console.log(`   列：${sample.metaData.map(m => m.name).join(', ')}`);
            console.log(`   前 3 条:`);
            sample.rows.forEach((row, i) => {
                const simplified = {};
                sample.metaData.forEach(m => {
                    simplified[m.name] = row[m.name];
                });
                console.log(`     [${i+1}] ${JSON.stringify(simplified)}`);
            });
        }
        
        // 6. 如果有 ORD_BAS，查询示例数据
        if (result.orderTables.includes('ORD_BAS')) {
            console.log('\n6. ORD_BAS 表示例数据:');
            const sample = await connection.execute(
                `SELECT * FROM ord_bas WHERE ROWNUM <= 3`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            console.log(`   列：${sample.metaData.map(m => m.name).join(', ')}`);
            console.log(`   前 3 条:`);
            sample.rows.forEach((row, i) => {
                const simplified = {};
                sample.metaData.forEach(m => {
                    simplified[m.name] = row[m.name];
                });
                console.log(`     [${i+1}] ${JSON.stringify(simplified)}`);
            });
        }
        
        return result;
        
    } catch (err) {
        console.log(`✗ 连接失败：${err.message}`);
        return {
            factory: dbConfig.name,
            connected: false,
            error: err.message
        };
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log(`✓ 连接已关闭`);
            } catch (e) {}
        }
    }
}

async function main() {
    console.log('========================================');
    console.log('易捷查询 - 数据库结构探索');
    console.log('========================================\n');
    
    const results = [];
    
    for (const [key, dbConfig] of Object.entries(DB_CONFIGS)) {
        const result = await exploreDatabase(dbConfig);
        results.push(result);
        
        // 每个数据库之间暂停一下
        if (key !== Object.keys(DB_CONFIGS).pop()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // 保存结果
    const outputPath = '/home/admin/.openclaw/workspace/YiJie-Query-Tool/db_explorer_results.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n========================================');
    console.log('探索完成！');
    console.log(`详细结果已保存到：${outputPath}`);
    console.log('========================================');
}

main().catch(err => {
    console.error('探索失败:', err);
    process.exit(1);
});
