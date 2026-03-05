/**
 * 查找客户表中关联业务员的字段
 */

const oracledb = require('oracledb');

const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function findClntSalesmanField() {
    console.log('========================================');
    console.log('查找客户表中关联业务员的字段');
    console.log('========================================\n');

    let conn;
    try {
        conn = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        // ========================================
        // 1. 查看 pb_clnt 表所有字段（包括隐藏字段）
        // ========================================
        console.log('【1】pb_clnt 表所有字段');
        const clntCols = await conn.execute(`
            SELECT column_name, data_type, data_length
            FROM all_tab_columns
            WHERE table_name = 'PB_CLNT' AND owner = 'FERP'
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   字段列表:');
        clntCols.rows.forEach(r => {
            console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
        });

        // ========================================
        // 2. 查看 pb_clnt 示例数据（所有字段）
        // ========================================
        console.log('\n【2】pb_clnt 表 - 完整示例数据');
        const clntData = await conn.execute(`
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
        // 3. 查找可能存储业务员的字段（包含 AGENT/SALES/EMP 等关键字）
        // ========================================
        console.log('\n【3】查找可能存储业务员的字段');
        const salesmanFields = await conn.execute(`
            SELECT column_name, data_type
            FROM all_tab_columns
            WHERE table_name = 'PB_CLNT' AND owner = 'FERP'
              AND (column_name LIKE '%AGENT%' 
                   OR column_name LIKE '%SALES%'
                   OR column_name LIKE '%EMP%'
                   OR column_name LIKE '%MOBILE%'
                   OR column_name LIKE '%USER%')
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   可能的业务员字段:');
        if (salesmanFields.rows.length > 0) {
            salesmanFields.rows.forEach(r => {
                console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
            });
        } else {
            console.log('     没有找到明显的业务员字段');
        }

        // ========================================
        // 4. 查看 ord_bas 表是否有业务员字段
        // ========================================
        console.log('\n【4】ord_bas 表是否有业务员字段');
        const basCols = await conn.execute(`
            SELECT column_name, data_type
            FROM all_tab_columns
            WHERE table_name = 'ORD_BAS' AND owner = 'FERP'
              AND (column_name LIKE '%AGENT%' 
                   OR column_name LIKE '%SALES%'
                   OR column_name LIKE '%EMP%'
                   OR column_name LIKE '%MOBILE%'
                   OR column_name LIKE '%USER%'
                   OR column_name LIKE '%AGNT%')
            ORDER BY column_id
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   ord_bas 可能的业务员字段:');
        if (basCols.rows.length > 0) {
            basCols.rows.forEach(r => {
                console.log(`     ${r.COLUMN_NAME} (${r.DATA_TYPE})`);
            });
        } else {
            console.log('     没有找到明显的业务员字段');
        }

        // ========================================
        // 5. 查看订单和客户的关系
        // ========================================
        console.log('\n【5】查看订单和客户的关系');
        const relationSql = `
            SELECT 
                b.serial,
                b.clntcde as ord_bas_clntcde,
                t.clntcde as ord_ct_clntcde,
                c.clntnme
            FROM ferp.ord_bas b
            LEFT JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            FETCH FIRST 10 ROWS ONLY
        `;
        const relationResult = await conn.execute(relationSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log('   订单-客户关系 (前10):');
        relationResult.rows.forEach((r, i) => {
            console.log(`   ${i+1}. 单号:${r.SERIAL} ord_bas客户:${r.ORD_BAS_CLNTCDE} ord_ct客户:${r.ORD_CT_CLNTCDE} 客户名:${r.CLNTNME}`);
        });

        // ========================================
        // 6. 测试直接用 ord_bas.clntcde 关联 pb_dept_member
        // ========================================
        console.log('\n【6】测试：ord_bas.clntcde 是否能直接关联业务员？');
        
        // 先查看有没有中间表
        const midTableCheck = await conn.execute(`
            SELECT table_name
            FROM all_tables
            WHERE owner = 'FERP'
              AND (table_name LIKE '%CLNT%EMP%' 
                   OR table_name LIKE '%EMP%CLNT%'
                   OR table_name LIKE '%CLIENT%MEMBER%')
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log('   可能的中间表:');
        if (midTableCheck.rows.length > 0) {
            midTableCheck.rows.forEach(r => {
                console.log(`     ${r.TABLE_NAME}`);
            });
        } else {
            console.log('     没有找到明显的中间表');
        }

        // ========================================
        // 7. 重新理解业务逻辑：ord_ct.agntcde 到底是什么？
        // ========================================
        console.log('\n【7】重新分析：ord_ct.agntcde 与 pb_dept_member.empcde 的关系');
        
        // 找出同时存在于两个表中的编码
        const commonCodes = await conn.execute(`
            SELECT DISTINCT t.agntcde
            FROM ferp.ord_ct t
            JOIN ferp.ord_bas b ON t.serial = b.serial
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
              AND t.agntcde IN (SELECT empcde FROM ferp.pb_dept_member WHERE isactive = 'Y')
            FETCH FIRST 20 ROWS ONLY
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   同时在 ord_ct.agntcde 和 pb_dept_member.empcde 中的编码 (${commonCodes.rows.length}个):`);
        commonCodes.rows.forEach(r => {
            console.log(`     [${r.AGNTCDE}]`);
        });

        // ========================================
        // 8. 最终结论：使用 COALESCE 组合多种匹配方式
        // ========================================
        console.log('\n【8】最终方案：使用 COALESCE 组合多种匹配方式');
        
        const finalSql = `
            SELECT 
                b.serial as 单号，
                t.agntcde as ord_ct_agntcde,
                m1.empnme as 直接匹配的业务员,
                m1.dptnme as 直接匹配的部门,
                m2.empnme as hr_base匹配的业务员
            FROM ferp.ord_bas b
            JOIN ferp.ord_ct t ON b.serial = t.serial
            LEFT JOIN ferp.pb_dept_member m1 ON t.agntcde = m1.empcde AND m1.isactive = 'Y'
            LEFT JOIN ferp.hr_base h ON t.agntcde = h.mobile AND h.status = 'Y'
            LEFT JOIN ferp.pb_dept_member m2 ON h.empcde = m2.empcde AND m2.isactive = 'Y'
            WHERE b.isactive = 'Y'
              AND b.created >= DATE '2026-03-04'
              AND b.created < DATE '2026-03-05'
            ORDER BY b.created
            FETCH FIRST 20 ROWS ONLY
        `;
        
        const finalResult = await conn.execute(finalSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log('   对比不同匹配方式的结果 (前20):');
        finalResult.rows.forEach((r, i) => {
            const matched = r.直接匹配的业务员 || r.HR_BASE匹配的业务员 ? '✓' : '✗';
            console.log(`   ${i+1}. ${matched} 单号:${r.单号} agntcde:[${r.ORD_CT_AGNTCDE}] 直接:${r.直接匹配的业务员 || '-'} hr:${r.HR_BASE匹配的业务员 || '-'}`);
        });

        console.log('\n========================================');
        console.log('请确认正确的业务逻辑');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (conn) try { await conn.close(); } catch {}
    }
}

findClntSalesmanField().catch(console.error);
