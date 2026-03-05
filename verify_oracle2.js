const oracledb = require('oracledb');

// 设置为 Thick 模式以支持旧版本 Oracle 数据库
oracledb.initOracleClient({ libDir: '/usr/lib/oracle/21/client64/lib' });

// 数据库连接配置
const DB_CONFIGS = {
    易捷集团: {
        user: 'fgrp',
        password: 'kuke.fgrp',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    新厂新系统: {
        user: 'ferp',
        password: 'b0003',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.134.7.141)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    老厂新系统: {
        user: 'read',
        password: 'ejsh.read',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.132.30)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    },
    温森新系统: {
        user: 'read',
        password: 'ejsh.read',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=db.05.forestpacking.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)))'
    }
};

async function describeTable(conn, tableName) {
    const result = await conn.execute(
        `SELECT column_name, data_type, data_length 
         FROM user_tab_columns 
         WHERE table_name = :table
         ORDER BY column_id`,
        [tableName.toUpperCase()],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows;
}

async function testQuery(conn, sql, params = [], options = { outFormat: oracledb.OUT_FORMAT_OBJECT }) {
    try {
        const result = await conn.execute(sql, params, options);
        return result.rows;
    } catch (err) {
        console.error('查询失败:', err.message);
        return null;
    }
}

async function main() {
    console.log('========================================');
    console.log('验证易捷数据库表结构和数据');
    console.log('========================================\n');

    // 1. 连接易捷集团数据库
    console.log('>>> 连接易捷集团数据库...');
    const conn = await oracledb.getConnection(DB_CONFIGS.易捷集团);
    console.log('✓ 连接成功\n');

    // 2. 查询 pb_dept_member 表结构
    console.log('>>> 查询 pb_dept_member 表结构...');
    const deptMemberCols = await describeTable(conn, 'PB_DEPT_MEMBER');
    console.log('字段列表:');
    deptMemberCols.forEach(col => {
        console.log(`  ${col.COLUMN_NAME} - ${col.DATA_TYPE}(${col.DATA_LENGTH})`);
    });

    // 3. 测试 pb_dept_member 查询
    console.log('\n>>> 测试 pb_dept_member 查询...');
    const rows1 = await testQuery(conn, `SELECT * FROM pb_dept_member WHERE ROWNUM <= 3`);
    if (rows1) {
        console.log('数据示例:');
        rows1.forEach(row => console.log(`  ${JSON.stringify(row)}`));
    }

    // 4. 测试 pb_dept 查询
    console.log('\n>>> 测试 pb_dept 查询...');
    const rows2 = await testQuery(conn, `SELECT * FROM pb_dept WHERE ROWNUM <= 3`);
    if (rows2) {
        console.log('数据示例:');
        rows2.forEach(row => console.log(`  ${JSON.stringify(row)}`));
    }

    // 5. 测试 pb_emps 查询
    console.log('\n>>> 查询 PB_EMPS 表...');
    const rows3 = await testQuery(conn, `SELECT * FROM PB_EMPS WHERE ROWNUM <= 3`);
    if (rows3) {
        console.log('数据示例:');
        rows3.forEach(row => console.log(`  ${JSON.stringify(row)}`));
    }

    // 6. 测试新的 SQL 查询
    console.log('\n>>> 测试修复后的 pb_dept_member 查询...');
    const fixedSql = `SELECT m.user_cde as EMPCDE, m.dept_cde as TEMCDE, m.dept_cde as TEMCDE2, 
                             m.user_nme as EMPNME, d.dept_nme as TEMNME
                      FROM pb_dept_member m
                      LEFT JOIN pb_dept d ON m.dept_cde = d.dept_cde
                      WHERE m.isactive = 'Y'
                      ORDER BY d.dept_nme, m.user_nme`;
    const rows4 = await testQuery(conn, fixedSql);
    if (rows4) {
        console.log(`查询成功，返回 ${rows4.length} 条数据`);
        console.log('前3条数据示例:');
        rows4.slice(0, 3).forEach(row => console.log(`  ${JSON.stringify(row)}`));
    }

    // 7. 测试今天的订单数据
    console.log('\n>>> 测试今天的订单数据...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sqlCount = `SELECT COUNT(*) as cnt FROM ord_bas 
                      WHERE created >= TO_DATE(:dateFrom, 'YYYY-MM-DD') 
                        AND created < TO_DATE(:dateTo, 'YYYY-MM-DD') 
                        AND isactive = 'Y'`;
    const rows5 = await testQuery(conn, sqlCount, [
        yesterday.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
    ]);
    if (rows5) {
        console.log(`昨天(${yesterday.toISOString().split('T')[0]})到今天(${today.toISOString().split('T')[0]})的订单数: ${rows5[0].CNT}`);
    }

    // 8. 测试销售员图的完整 SQL
    console.log('\n>>> 测试销售员图查询 SQL...');
    const salesSql = `SELECT b.objtyp, t.agntcde, nvl(sum(b.accamt),0) as 金额, 
                             nvl(sum(t.acreage * t.ordnum),0) as 面积, count(*) as 单数 
                      FROM ord_bas b 
                      JOIN ord_ct t ON b.serial = t.serial 
                      WHERE b.status='Y' and b.isactive='Y'
                      AND b.created >= TO_DATE(:dateFrom, 'YYYY-MM-DD') 
                      AND b.created < TO_DATE(:dateTo, 'YYYY-MM-DD')
                      GROUP BY t.agntcde, b.objtyp 
                      ORDER BY t.agntcde`;
    const rows6 = await testQuery(conn, salesSql, [
        yesterday.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
    ]);
    if (rows6) {
        console.log(`查询成功，返回 ${rows6.length} 条数据`);
        rows6.forEach(row => console.log(`  ${JSON.stringify(row)}`));
    } else {
        console.log('查询返回空结果');
    }

    // 9. 测试 hr_base 表
    console.log('\n>>> 查询 HR_BASE 表...');
    const rows7 = await testQuery(conn, `SELECT * FROM HR_BASE WHERE ROWNUM <= 3`);
    if (rows7) {
        console.log('数据示例:');
        rows7.forEach(row => console.log(`  ${JSON.stringify(row)}`));
    }

    // 10. 测试 ord_bas 表结构
    console.log('\n>>> 查询 ORD_BAS 表结构...');
    const ordBasCols = await describeTable(conn, 'ORD_BAS');
    console.log('字段列表:');
    ordBasCols.forEach(col => {
        console.log(`  ${col.COLUMN_NAME} - ${col.DATA_TYPE}(${col.DATA_LENGTH})`);
    });

    // 11. 测试 ord_ct 表结构
    console.log('\n>>> 查询 ORD_CT 表结构...');
    const ordCtCols = await describeTable(conn, 'ORD_CT');
    console.log('字段列表:');
    ordCtCols.forEach(col => {
        console.log(`  ${col.COLUMN_NAME} - ${col.DATA_TYPE}(${col.DATA_LENGTH})`);
    });

    await conn.close();
    console.log('\n========================================');
    console.log('验证完成！');
    console.log('========================================');
}

main().catch(console.error);
