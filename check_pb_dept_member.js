const oracledb = require('oracledb');

// 启用 Thin 模式连接旧版本数据库
oracledb.initOracleClient({ thin: true });

// 易捷集团数据库（用于查询部门和业务员数据）
const dbFgrp = { 
    connectString: "36.138.130.91:1521/dbms",
    user: "fgrp",
    password: "kuke.fgrp"
};

// 老厂新系统（用于对比）
const dbFerp = { 
    connectString: "36.138.132.30:1521/dbms",
    user: "read",
    password: "ejsh.read"
};

async function checkTableStructure(dbConfig, dbName) {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString
        });
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`数据库：${dbName}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`✓ 连接成功！`);
        
        // 检查表是否存在
        const tableCheck = await connection.execute(`
            SELECT table_name 
            FROM all_tables 
            WHERE table_name = 'PB_DEPT_MEMBER'
        `);
        
        if (tableCheck.rows.length === 0) {
            console.log(`⚠️  表 PB_DEPT_MEMBER 在 ${dbName} 中不存在`);
            await connection.close();
            return;
        }
        
        console.log(`✓ 表 PB_DEPT_MEMBER 存在于 ${dbName}`);
        
        // 查询表的详细结构
        const columns = await connection.execute(`
            SELECT 
                c.column_name, 
                c.data_type, 
                c.data_length, 
                c.data_precision,
                c.data_scale,
                c.nullable,
                c.column_id,
                m.comments
            FROM all_tab_columns c
            LEFT JOIN all_col_comments m 
                ON c.owner = m.owner 
                AND c.table_name = m.table_name 
                AND c.column_name = m.column_name
            WHERE c.table_name = 'PB_DEPT_MEMBER'
            ORDER BY c.column_id
        `);
        
        console.log(`\n${'序号'.padEnd(6)} ${'字段名'.padEnd(25)} ${'类型'.padEnd(15)} ${'长度'.padStart(6)} ${'精度'.padStart(6)} ${'小数'.padStart(4)} ${'可空'.padEnd(6)} ${'注释'}`);
        console.log('-'.repeat(110));
        
        for (const row of columns.rows) {
            const [colName, dataType, dataLength, dataPrecision, dataScale, nullable, columnId, comments] = row;
            console.log(
                `${String(columnId).padEnd(6)} ` +
                `${colName.padEnd(25)} ` +
                `${dataType.padEnd(15)} ` +
                `${String(dataLength).padStart(6)} ` +
                `${(dataPrecision !== null ? String(dataPrecision) : '').padStart(6)} ` +
                `${(dataScale !== null ? String(dataScale) : '').padStart(4)} ` +
                `${nullable.padEnd(6)} ` +
                `${comments || ''}`
            );
        }
        
        // 查询示例数据
        console.log(`\n示例数据（前 5 条）:`);
        const sampleData = await connection.execute(`
            SELECT * FROM PB_DEPT_MEMBER WHERE ROWNUM <= 5
        `);
        
        if (sampleData.rows.length > 0) {
            const colNames = sampleData.metaData.map(m => m.name);
            
            console.log(`\n${'字段'.padEnd(25)} ${'示例值 1'.padEnd(30)} ${'示例值 2'.padEnd(30)}`);
            console.log('-'.repeat(85));
            
            for (let i = 0; i < colNames.length; i++) {
                const val1 = sampleData.rows.length > 0 && sampleData.rows[0][i] !== null ? String(sampleData.rows[0][i]) : 'NULL';
                const val2 = sampleData.rows.length > 1 && sampleData.rows[1][i] !== null ? String(sampleData.rows[1][i]) : 'NULL';
                console.log(`${colNames[i].padEnd(25)} ${val1.padEnd(30)} ${val2.padEnd(30)}`);
            }
        }
        
        await connection.close();
    } catch (err) {
        console.error(`❌ 错误：${err.message}`);
        if (connection) {
            try { await connection.close(); } catch (e) {}
        }
    }
}

async function main() {
    console.log(`${'='.repeat(120)}`);
    console.log('查询 pb_dept_member 表完整结构');
    console.log(`${'='.repeat(120)}`);
    
    // 查询易捷集团数据库
    await checkTableStructure(dbFgrp, "易捷集团 (fgrp)");
    
    // 查询老厂新系统数据库
    await checkTableStructure(dbFerp, "老厂新系统 (ferp)");
    
    console.log(`\n${'='.repeat(120)}`);
    console.log('查询完成！');
    console.log(`${'='.repeat(120)}`);
}

main();
