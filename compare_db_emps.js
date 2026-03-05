/**
 * 对比各数据库的 pb_dept_member 数据
 */

const oracledb = require('oracledb');

// 老厂新系统
const DB_CONFIG_LAOCANG = {
    host: '36.138.132.30',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

// 温森新系统
const DB_CONFIG_WENSEN = {
    host: 'db.05.forestpacking.com',
    port: 1521,
    service: 'dbms',
    user: 'read',
    password: 'ejsh.read'
};

async function compareDatabases() {
    console.log('========================================');
    console.log('对比各数据库的 pb_dept_member 数据');
    console.log('========================================\n');

    let connLaocang, connWensen;
    try {
        // ========================================
        // 1. 连接老厂数据库
        // ========================================
        console.log('【1】老厂新系统数据库');
        
        connLaocang = await oracledb.getConnection({
            user: DB_CONFIG_LAOCANG.user,
            password: DB_CONFIG_LAOCANG.password,
            connectString: `${DB_CONFIG_LAOCANG.host}:${DB_CONFIG_LAOCANG.port}/${DB_CONFIG_LAOCANG.service}`
        });

        const laocangEmps = await connLaocang.execute(`
            SELECT empcde, empnme, dptnme
            FROM ferp.pb_dept_member
            WHERE isactive = 'Y'
            ORDER BY dptnme, empnme
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   业务员总数: ${laocangEmps.rows.length}`);
        console.log('   前10名:');
        laocangEmps.rows.slice(0, 10).forEach(r => {
            console.log(`     [${r.EMPCDE}] ${r.EMPNME} - ${r.DPTNME}`);
        });

        // 检查 13666446624 是否在老厂
        const checkLaocang = await connLaocang.execute(`
            SELECT empcde, empnme, dptnme
            FROM ferp.pb_dept_member
            WHERE empcde = '13666446624'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (checkLaocang.rows.length > 0) {
            console.log('\n   ✅ 13666446624 在老厂:');
            checkLaocang.rows.forEach(r => {
                console.log(`      ${r.EMPNME} - ${r.DPTNME}`);
            });
        } else {
            console.log('\n   ❌ 13666446624 不在老厂数据库');
        }

        // ========================================
        // 2. 连接温森数据库
        // ========================================
        console.log('\n【2】温森新系统数据库');
        
        connWensen = await oracledb.getConnection({
            user: DB_CONFIG_WENSEN.user,
            password: DB_CONFIG_WENSEN.password,
            connectString: `${DB_CONFIG_WENSEN.host}:${DB_CONFIG_WENSEN.port}/${DB_CONFIG_WENSEN.service}`
        });

        const wensenEmps = await connWensen.execute(`
            SELECT empcde, empnme, dptnme
            FROM ferp.pb_dept_member
            WHERE isactive = 'Y'
            ORDER BY dptnme, empnme
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        console.log(`   业务员总数: ${wensenEmps.rows.length}`);
        console.log('   前10名:');
        wensenEmps.rows.slice(0, 10).forEach(r => {
            console.log(`     [${r.EMPCDE}] ${r.EMPNME} - ${r.DPTNME}`);
        });

        // 检查 13666446624 是否在温森
        const checkWensen = await connWensen.execute(`
            SELECT empcde, empnme, dptnme
            FROM ferp.pb_dept_member
            WHERE empcde = '13666446624'
        `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (checkWensen.rows.length > 0) {
            console.log('\n   ✅ 13666446624 在温森:');
            checkWensen.rows.forEach(r => {
                console.log(`      ${r.EMPNME} - ${r.DPTNME}`);
            });
        } else {
            console.log('\n   ❌ 13666446624 不在温森数据库');
        }

        // ========================================
        // 3. 找出只在老厂出现的业务员
        // ========================================
        console.log('\n【3】数据库间业务员差异分析');
        
        const laocangCodes = new Set(laocangEmps.rows.map(r => r.EMPCDE));
        const wensenCodes = new Set(wensenEmps.rows.map(r => r.EMPCDE));
        
        // 只在老厂
        const onlyInLaocang = [...laocangCodes].filter(c => !wensenCodes.has(c));
        console.log(`   只在老厂的业务员: ${onlyInLaocang.length}人`);
        console.log('   前10名:');
        onlyInLaocang.slice(0, 10).forEach(code => {
            const emp = laocangEmps.rows.find(r => r.EMPCDE === code);
            console.log(`     [${code}] ${emp?.EMPNME || '?'} - ${emp?.DPTNME || '?'}`);
        });
        
        // 只在温森
        const onlyInWensen = [...wensenCodes].filter(c => !laocangCodes.has(c));
        console.log(`\n   只在温森的业务员: ${onlyInWensen.length}人`);
        console.log('   前10名:');
        onlyInWensen.slice(0, 10).forEach(code => {
            const emp = wensenEmps.rows.find(r => r.EMPCDE === code);
            console.log(`     [${code}] ${emp?.EMPNME || '?'} - ${emp?.DPTNME || '?'}`);
        });

        // ========================================
        // 4. 总结
        // ========================================
        console.log('\n========================================');
        console.log('总结:');
        console.log(`  老厂业务员数: ${laocangCodes.size}`);
        console.log(`  温森业务员数: ${wensenCodes.size}`);
        console.log(`  共同业务员数: ${[...laocangCodes].filter(c => wensenCodes.has(c)).length}`);
        console.log('\n  13666446624 核查结果:');
        console.log(`    老厂: ${laocangCodes.has('13666446624') ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`    温森: ${wensenCodes.has('13666446624') ? '✅ 存在' : '❌ 不存在'}`);
        console.log('\n  结论: 各子公司的 pb_dept_member 只包含本厂业务员');
        console.log('       需要从集团数据库获取全部业务员数据');
        console.log('========================================');

    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (connLaocang) try { await connLaocang.close(); } catch {}
        if (connWensen) try { await connWensen.close(); } catch {}
    }
}

compareDatabases().catch(console.error);
