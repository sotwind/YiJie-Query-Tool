#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试 Oracle 数据库连接和表结构验证"""

import cx_Oracle
import sys

# 数据库配置（从 DatabaseInfos.cs 复制）
DATABASES = [
    {"name": "新厂新系统", "host": "36.134.7.141", "port": 1521, "service": "dbms", "user": "ferp", "password": "b0003"},
    {"name": "老厂新系统", "host": "36.138.132.30", "port": 1521, "service": "dbms", "user": "read", "password": "ejsh.read"},
    {"name": "临海", "host": "36.137.213.189", "port": 1521, "service": "dbms", "user": "read", "password": "ejsh.read"},
    {"name": "温森新系统", "host": "db.05.forestpacking.com", "port": 1521, "service": "dbms", "user": "read", "password": "ejsh.read"},
]

def test_connection(db_config):
    """测试数据库连接并检查关键表和字段"""
    print(f"\n{'='*60}")
    print(f"测试数据库：{db_config['name']}")
    print(f"连接信息：{db_config['host']}:{db_config['port']}/{db_config['service']}")
    print(f"{'='*60}")
    
    try:
        # 创建连接
        dsn = cx_Oracle.makedsn(db_config['host'], db_config['port'], service_name=db_config['service'])
        conn = cx_Oracle.connect(user=db_config['user'], password=db_config['password'], dsn=dsn)
        print(f"✓ 连接成功！")
        
        cursor = conn.cursor()
        
        # 检查 ord_bas 表是否存在
        print("\n1. 检查 ord_bas 表...")
        cursor.execute("SELECT COUNT(*) FROM ord_bas WHERE ROWNUM = 1")
        count = cursor.fetchone()[0]
        print(f"   ✓ ord_bas 表存在，记录数：{count}")
        
        # 检查 ord_bas 表的关键字段
        print("\n2. 检查 ord_bas 表字段结构...")
        cursor.execute("""
            SELECT column_name, data_type, data_length 
            FROM user_tab_columns 
            WHERE table_name = 'ORD_BAS' 
            ORDER BY column_id
        """)
        columns = {row[0]: {'type': row[1], 'length': row[2]} for row in cursor.fetchall()}
        
        key_columns = ['SERIAL', 'PTDATE', 'AGNTCDE', 'CLNTCDE', 'PRDCDE', 'PRDNME', 
                       'ORDNUM', 'QUOPRC', 'PRICES', 'ACCAMT', 'STATUS']
        
        print("   关键字段检查:")
        for col in key_columns:
            if col in columns:
                print(f"   ✓ {col}: {columns[col]['type']}({columns[col]['length']})")
            else:
                print(f"   ✗ {col}: 不存在!")
        
        # 特别检查 QUOPRC 字段
        if 'QUOPRC' in columns:
            print(f"\n   ✓ QUOPRC 字段存在，可以用于报价对比")
        else:
            print(f"\n   ⚠ QUOPRC 字段不存在！需要寻找替代字段")
            # 查找可能包含报价的字段
            price_cols = [col for col in columns.keys() if 'PRC' in col or 'PRICE' in col]
            if price_cols:
                print(f"   可能的替代字段：{', '.join(price_cols)}")
        
        # 检查 pb_clnt 表
        print("\n3. 检查 pb_clnt 表...")
        cursor.execute("SELECT COUNT(*) FROM pb_clnt WHERE ROWNUM = 1")
        count = cursor.fetchone()[0]
        print(f"   ✓ pb_clnt 表存在，记录数：{count}")
        
        # 检查 pb_emps 表（业务员表）
        print("\n4. 检查 pb_emps 表...")
        cursor.execute("SELECT COUNT(*) FROM pb_emps WHERE ROWNUM = 1")
        count = cursor.fetchone()[0]
        print(f"   ✓ pb_emps 表存在，记录数：{count}")
        
        # 检查是否有 EMPCDE, TEMCDE, TEMNME 字段
        cursor.execute("""
            SELECT column_name 
            FROM user_tab_columns 
            WHERE table_name = 'PB_EMPS'
        """)
        emp_cols = [row[0] for row in cursor.fetchall()]
        print(f"   字段：{', '.join(emp_cols[:10])}...")
        
        # 测试查询（模拟实际业务查询）
        print("\n5. 测试报价差额统计查询...")
        test_sql = """
            SELECT 
                b.serial,
                b.ptdate,
                b.agntcde,
                b.clntcde,
                b.prdcde,
                b.prdnme,
                b.ordnum,
                b.quoprc,
                b.prices,
                b.accamt
            FROM ord_bas b
            WHERE b.status = 'Y'
              AND b.quoprc IS NOT NULL
              AND ROWNUM <= 5
        """
        cursor.execute(test_sql)
        rows = cursor.fetchall()
        if rows:
            print(f"   ✓ 查询成功，返回 {len(rows)} 条记录")
            print("\n   示例数据:")
            print(f"   {'单号':<15} {'日期':<12} {'业务员':<8} {'客户':<10} {'数量':>8} {'报价':>10} {'卖价':>10} {'总额':>12}")
            print(f"   {'-'*95}")
            for row in rows:
                serial, ptdate, agntcde, clntcde, prdcde, prdnme, ordnum, quoprc, prices, accamt = row
                quoprc = float(quoprc) if quoprc else 0
                prices = float(prices) if prices else 0
                ordnum = int(ordnum) if ordnum else 0
                accamt = float(accamt) if accamt else 0
                calc_amt = quoprc * ordnum
                diff = accamt - calc_amt
                diff_rate = (diff / calc_amt * 100) if calc_amt > 0 else 0
                print(f"   {serial:<15} {str(ptdate)[:10]:<12} {agntcde or 'N/A':<8} {clntcde or 'N/A':<10} {ordnum:>8} {quoprc:>10.2f} {prices:>10.2f} {accamt:>12.2f}")
                print(f"      报价金额：{calc_amt:.2f}, 差额：{diff:.2f}, 差额率：{diff_rate:.2f}%")
        else:
            print(f"   ⚠ 查询返回空结果（可能没有符合条件的数据）")
        
        cursor.close()
        conn.close()
        print(f"\n✓ {db_config['name']} 测试完成！")
        return True
        
    except cx_Oracle.DatabaseError as e:
        error = e.args[0]
        print(f"✗ 数据库错误：{error.code}: {error.message}")
        return False
    except Exception as e:
        print(f"✗ 连接失败：{str(e)}")
        return False

def main():
    print("="*60)
    print("Oracle 数据库连接测试 - 易捷查询工具")
    print("="*60)
    
    results = {}
    for db in DATABASES:
        results[db['name']] = test_connection(db)
    
    print("\n" + "="*60)
    print("测试汇总")
    print("="*60)
    for name, success in results.items():
        status = "✓ 成功" if success else "✗ 失败"
        print(f"{name}: {status}")
    
    # 统计成功数量
    success_count = sum(1 for v in results.values() if v)
    print(f"\n总计：{success_count}/{len(DATABASES)} 数据库连接成功")

if __name__ == "__main__":
    main()
