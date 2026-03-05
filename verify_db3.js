/**
 * 使用 ReadyGo3 库验证 Oracle 数据库
 * 安装: npm install toolgood.readygo3
 */

const { SqlHelperFactory, SqlType } = require('toolgood.readygo3');

// 数据库连接配置
const DB_CONFIGS = {
    易捷集团: {
        name: '易捷集团',
        connString: "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp;"
    },
    新厂新系统: {
        name: '新厂新系统',
        connString: "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.134.7.141)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=ferp;Password=b0003;"
    },
    老厂新系统: {
        name: '老厂新系统',
        connString: "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.132.30)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=read;Password=ejsh.read;"
    },
    温森新系统: {
        name: '温森新系统',
        connString: "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=db.05.forestpacking.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=read;Password=ejsh.read;"
    }
};

async function testQuery(DB, sql, params = []) {
    try {
        const helper = SqlHelperFactory.OpenDatabase(DB.connString, SqlType.Oracle);
        const result = await helper.Select(sql, params);
        helper.close();
        return result;
    } catch (err) {
        console.error(`查询失败 (${DB.name}):`, err.message);
        return null;
    }
}

async function main() {
    console.log('========================================');
    console.log('验证易捷数据库表结构和数据');
    console.log('========================================\n');

    // 1. 测试易捷集团数据库连接
    console.log('>>> 测试易捷集团数据库连接...');
    try {
        const conn = DB_CONFIGS.易捷集团;
        const helper = SqlHelperFactory.OpenDatabase(conn.connString, SqlType.Oracle);
        console.log('✓ 连接成功\n');
        
        // 2. 查询 PB_DEPT_MEMBER 表结构
        console.log('>>> 查询 PB_DEPT_MEMBER 表结构...');
        const cols1 = await helper.ExecuteDataTable("SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'PB_DEPT_MEMBER' ORDER BY column_id");
        console.log('字段列表:');
        for (let i = 0; i < cols1.rows.length; i++) {
            const row = cols1.rows[i];
            console.log(`  ${row.COLUMN_NAME} - ${row.DATA_TYPE}(${row.DATA_LENGTH})`);
        }
        
        // 3. 查询 PB_DEPT 表结构
        console.log('\n>>> 查询 PB_DEPT 表结构...');
        const cols2 = await helper.ExecuteDataTable("SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'PB_DEPT' ORDER BY column_id");
        console.log('字段列表:');
        for (let i = 0; i < cols2.rows.length; i++) {
            const row = cols2.rows[i];
            console.log(`  ${row.COLUMN_NAME} - ${row.DATA_TYPE}(${row.DATA_LENGTH})`);
        }
        
        // 4. 测试 PB_DEPT_MEMBER 查询
        console.log('\n>>> 测试 PB_DEPT_MEMBER 查询...');
        const rows1 = await helper.Select("SELECT * FROM pb_dept_member WHERE ROWNUM <= 3");
        console.log(`查询成功，返回 ${rows1 ? rows1.length : 0} 条数据`);
        if (rows1 && rows1.length > 0) {
            console.log('数据示例:');
            for (let i = 0; i < Math.min(3, rows1.length); i++) {
                console.log(`  ${JSON.stringify(rows1[i])}`);
            }
        }
        
        // 5. 测试修复后的 SQL 查询
        console.log('\n>>> 测试修复后的 pb_dept_member 查询...');
        const fixedSql = `SELECT m.user_cde as EMPCDE, m.dept_cde as TEMCDE, m.dept_cde as TEMCDE2, 
                                 m.user_nme as EMPNME, d.dept_nme as TEMNME
                          FROM pb_dept_member m
                          LEFT JOIN pb_dept d ON m.dept_cde = d.dept_cde
                          WHERE m.isactive = 'Y'
                          ORDER BY d.dept_nme, m.user_nme`;
        const rows2 = await helper.Select(fixedSql);
        console.log(`查询成功，返回 ${rows2 ? rows2.length : 0} 条数据`);
        if (rows2 && rows2.length > 0) {
            console.log('前5条数据示例:');
            for (let i = 0; i < Math.min(5, rows2.length); i++) {
                console.log(`  ${JSON.stringify(rows2[i])}`);
            }
        }
        
        // 6. 测试今天的订单数据
        console.log('\n>>> 测试今天的订单数据...');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const sqlCount = `SELECT COUNT(*) as cnt FROM ord_bas WHERE created >= to_date(:dateFrom, 'YYYY-MM-DD') AND created < to_date(:dateTo, 'YYYY-MM-DD') AND isactive = 'Y'`;
        const rows3 = await helper.Select(sqlCount, { dateFrom: yesterday.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] });
        console.log(`昨天(${yesterday.toISOString().split('T')[0]})到今天(${today.toISOString().split('T')[0]})的订单数: ${rows3 && rows3.length > 0 ? rows3[0].CNT : 0}`);
        
        // 7. 测试销售员图查询 SQL
        console.log('\n>>> 测试销售员图查询 SQL...');
        const salesSql = `SELECT b.objtyp, t.agntcde, nvl(sum(b.accamt),0) as 金额, nvl(sum(t.acreage * t.ordnum),0) as 面积, count(*) as 单数 
                          FROM ord_bas b 
                          JOIN ord_ct t ON b.serial = t.serial 
                          WHERE b.status='Y' and b.isactive='Y'
                          AND b.created >= to_date(:dateFrom, 'YYYY-MM-DD') 
                          AND b.created < to_date(:dateTo, 'YYYY-MM-DD')
                          GROUP BY t.agntcde, b.objtyp 
                          ORDER BY t.agntcde`;
        const rows4 = await helper.Select(salesSql, { dateFrom: yesterday.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] });
        console.log(`查询成功，返回 ${rows4 ? rows4.length : 0} 条数据`);
        if (rows4 && rows4.length > 0) {
            console.log('前5条数据示例:');
            for (let i = 0; i < Math.min(5, rows4.length); i++) {
                console.log(`  ${JSON.stringify(rows4[i])}`);
            }
        }
        
        // 8. 测试 HR_BASE 表
        console.log('\n>>> 查询 HR_BASE 表...');
        const rows5 = await helper.Select("SELECT * FROM HR_BASE WHERE ROWNUM <= 3");
        console.log(`查询成功，返回 ${rows5 ? rows5.length : 0} 条数据`);
        if (rows5 && rows5.length > 0) {
            console.log('数据示例:');
            for (let i = 0; i < Math.min(3, rows5.length); i++) {
                console.log(`  ${JSON.stringify(rows5[i])}`);
            }
        }
        
        helper.close();
    } catch (err) {
        console.error('连接失败:', err.message);
    }

    console.log('\n========================================');
    console.log('验证完成！');
    console.log('========================================');
}

main().catch(console.error);
