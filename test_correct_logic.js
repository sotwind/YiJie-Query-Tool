/**
 * 验证正确的业务逻辑：
 * 1. 从集团数据库获取业务员
 * 2. 子公司订单 -> pb_clnt -> 业务员编码 -> 匹配集团业务员
 */

const oracledb = require('oracledb');

// 易捷集团数据库
const DB_CONFIG_GROUP = {
    host: '36.138.130.91',
    port: 1521,
    service: 'dbms',
    user: 'fgrp',
    password: 'kuke.fgrp'
};

// 老厂新系统
const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function testCorrectLogic() {
    console.log('========================================');
    console.log('验证正确的业务逻辑');
    console.log('========================================\n');

    let connGroup, connLaocang;
    try {
        // ========================================
        // 1. 从集团数据库获取所有业务员
        // ========================================
        console.log('【1】从易捷集团数据库获取业务员');
        
        connGroup = await oracledb.getConnection({
            user: DB_CONFIG_GROUP.user,
            password: DB_CONFIG_GROUP.password,
            connectString: `${DB_CONFIG_GROUP.host}:${DB_CONFIG_GROUP.port}/${DB_CONFIG_GROUP.service}`
        });

        const groupEmps = await connGroup.execute(`
            SELECT empcde, empnme, dptcde, dptnme
            FROM ferp.pb_dept_member
            WHERE isactive = 'Y'
            ORDER BY dptnme, empnme
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   集团数据库共有 ${groupEmps.rows.length} 名业务员`);
        console.log('   前10名:');
        groupEmps.rows.slice(0, 10).forEach(r => {
            console.log(`     [${r.EMPCDE}] ${r.EMPNME} - ${r.DPTNME}`);
        });

        // 创建业务员编码集合用于后续匹配
        const empCodeSet = new Set(groupEmps.rows.map(r => r.EMPCDE));
        console.log(`\n   业务员编码集合大小: ${empCodeSet.size}`);

        // ========================================
        // 2. 查看老厂的 pb_clnt 表结构
        // ========================================
        console.log('\n【2】查看老厂 pb_clnt 客户表');
        
        connLaocang = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // 查找 pb_clnt 中和业务员相关的字段
        const clntCols = await connLaocang.execute(`
            SELECT column_name, data_type
            FROM all_tab_columns
            WHERE table_name = 'PB_CLNT' AND owner = 'FERP'
              AND (column_name LIKE '%EMP%' OR column_name LIKE '%AGENT%' OR column_name LIKE '%SALES%')
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   pb_clnt 可能的业务员字段:');
        if (clntCols.rows.length > 0) {
            clntCols.rows.forEach(r => {
                console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
            });
        } else {
            console.log('     没有找到明显的业务员字段，查看所有字段...');
            const allCols = await connLaocang.execute(`
                SELECT column_name, data_type
                FROM all_tab_columns
                WHERE table_name = 'PB_CLNT' AND owner = 'FERP'
                ORDER BY column_id
            `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            allCols.rows.forEach(r => {
                console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
            });
        }

        // ========================================
        // 3. 查看老厂 pb_clnt 示例数据
        // ========================================
        console.log('\n【3】老厂 pb_clnt 示例数据');
        const clntData = await connLaocang.execute(`
            SELECT *
            FROM ferp.pb_clnt
            WHERE isactive = 'Y'
            FETCH FIRST 3 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   样例数据 (前3条):');
        clntData.rows.forEach((r, i) => {
            console.log(`\n   --- 第 ${i+1} 条 ---`);
            Object.keys(r).forEach(key => {
                if (r[key] !== null && r[key] !== undefined) {
                    console.log(`     ${key}: ${r[key]}`);
                }
            });
        });

        // ========================================
        // 4. 测试正确逻辑：订单 -> pb_clnt -> 业务员编码
        // ========================================
        console.log('\n【4】测试：订单 -> pb_clnt -> 业务员编码');
        
        // 先找出有业务员的客户
        const clntWithEmp = await connLaocang.execute(`
            SELECT clntcde, clntnme
            FROM ferp.pb_clnt
            WHERE isactive = 'Y'
              AND (empcde IS NOT NULL OR agntcde IS NOT NULL)
            FETCH FIRST 10 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   有业务员信息的客户 (${clntWithEmp.rows.length}个):`);
        clntWithEmp.rows.forEach(r => {
            console.log(`     [${r.CLNTCDE}] ${r.CLNTNME}`);
        });

        // ========================================
        // 5. 测试完整逻辑
        // ========================================
        console.log('\n【5】测试完整逻辑');
        
        // 假设 pb_clnt 有 empcde 或 agntcde 字段
        // 先从老厂查询订单和客户信息
        const orderSql = `
            SELECT 
                b.serial as 单号，
                b.clntcde as 客户编码，
                c.clntnme as 客户名称
            FROM ferp.ord_bas b
            LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY b.created
            FETCH FIRST 20 ROWS ONLY
        `;
        
        const orderResult = await connLaocang.execute(orderSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(`   订单数据 (${orderResult.rows.length}条):`);
        orderResult.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 单号:${r.单号} 客户:[${r.客户编码}] ${r.客户名称}`);
        });

        // ========================================
        // 6. 检查 pb_clnt 中哪些字段可能存储业务员信息
        // ========================================
        console.log('\n【6】检查 pb_clnt 中实际存储业务员的字段');
        
        // 查看有哪些字段有值
        const checkFields = ['empcde', 'agntcde', 'createdby', 'updatedby'];
        for (const field of checkFields) {
            try {
                const result = await connLaocang.execute(`
                    SELECT ${field}, COUNT(*) as cnt
                    FROM ferp.pb_clnt
                    WHERE isactive = 'Y' AND ${field} IS NOT NULL
                    GROUP BY ${field}
                    ORDER BY cnt DESC
                    FETCH FIRST 5 ROWS ONLY
                `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
                
                if (result.rows.length > 0) {
                    console.log(`\n   字段 ${field} 有值的示例:`);
                    result.rows.forEach(r => {
                        console.log(`     [${r[field.toUpperCase()]}]: ${r.CNT}条`);
                    });
                }
            } catch (e) {
                console.log(`   字段 ${field} 不存在或无法查询`);
            }
        }

        console.log('\n========================================');
        console.log('分析完成');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (connGroup) try { await connGroup.close(); } catch {}
        if (connLaocang) try { await connLaocang.close(); } catch {}
    }
}

testCorrectLogic().catch(console.error);
