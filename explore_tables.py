#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""探索 Oracle 数据库实际表结构"""

import cx_Oracle
import os

# 设置 Oracle 客户端路径
os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/oracle_instantclient/instantclient_21_1')

# 使用老厂新系统测试（已确认可以连接）
DB_CONFIG = {"host": "36.138.132.30", "port": 1521, "service": "dbms", "user": "read", "password": "ejsh.read"}

def explore_database():
    dsn = cx_Oracle.makedsn(DB_CONFIG['host'], DB_CONFIG['port'], service_name=DB_CONFIG['service'])
    conn = cx_Oracle.connect(user=DB_CONFIG['user'], password=DB_CONFIG['password'], dsn=dsn)
    cursor = conn.cursor()
    
    print("="*80)
    print("探索数据库表结构 - 老厂新系统")
    print("="*80)
    
    # 1. 查找所有包含"ORD"的表
    print("\n1. 查找订单相关表 (ORD%):")
    cursor.execute("SELECT table_name FROM user_tables WHERE table_name LIKE '%ORD%' ORDER BY table_name")
    for row in cursor.fetchall():
        print(f"   - {row[0]}")
    
    # 2. 查找所有包含"CLNT"的表
    print("\n2. 查找客户相关表 (CLNT%):")
    cursor.execute("SELECT table_name FROM user_tables WHERE table_name LIKE '%CLNT%' ORDER BY table_name")
    for row in cursor.fetchall():
        print(f"   - {row[0]}")
    
    # 3. 查找所有包含"EMP"的表
    print("\n3. 查找员工相关表 (EMP%):")
    cursor.execute("SELECT table_name FROM user_tables WHERE table_name LIKE '%EMP%' ORDER BY table_name")
    for row in cursor.fetchall():
        print(f"   - {row[0]}")
    
    # 4. 查找所有包含"PRC"或"PRICE"的表
    print("\n4. 查找价格相关表 (PRC%/PRICE%):")
    cursor.execute("SELECT table_name FROM user_tables WHERE table_name LIKE '%PRC%' OR table_name LIKE '%PRICE%' ORDER BY table_name")
    for row in cursor.fetchall():
        print(f"   - {row[0]}")
    
    # 5. 检查 ord_bas 实际结构
    print("\n5. ord_bas 表详细结构:")
    cursor.execute("""
        SELECT column_name, data_type, data_length, nullable 
        FROM user_tab_columns 
        WHERE table_name = 'ORD_BAS' 
        ORDER BY column_id
    """)
    print(f"   {'字段名':<30} {'类型':<15} {'长度':>8} {'可空':<6}")
    print(f"   {'-'*65}")
    for row in cursor.fetchall():
        print(f"   {row[0]:<30} {row[1]:<15} {row[2]:>8} {row[3]:<6}")
    
    # 6. 检查 pb_clnt 实际结构
    print("\n6. pb_clnt 表详细结构:")
    cursor.execute("""
        SELECT column_name, data_type, data_length, nullable 
        FROM user_tab_columns 
        WHERE table_name = 'PB_CLNT' 
        ORDER BY column_id
    """)
    print(f"   {'字段名':<30} {'类型':<15} {'长度':>8} {'可空':<6}")
    print(f"   {'-'*65}")
    cols = cursor.fetchall()
    for row in cols[:30]:  # 只显示前 30 个字段
        print(f"   {row[0]:<30} {row[1]:<15} {row[2]:>8} {row[3]:<6}")
    if len(cols) > 30:
        print(f"   ... 共{len(cols)}个字段")
    
    # 7. 查找可能包含业务员信息的表
    print("\n7. 查找可能包含业务员信息的表:")
    cursor.execute("""
        SELECT table_name 
        FROM user_tab_columns 
        WHERE column_name LIKE '%AGNT%' OR column_name LIKE '%SALE%' OR column_name LIKE '%EMP%'
        GROUP BY table_name
        ORDER BY table_name
    """)
    for row in cursor.fetchall():
        print(f"   - {row[0]}")
    
    # 8. 查找可能包含报价信息的表（MkPrctyp 系列）
    print("\n8. 查找报价表 (MK%PRC%):")
    cursor.execute("""
        SELECT table_name 
        FROM user_tables 
        WHERE table_name LIKE 'MK%PRC%' OR table_name LIKE 'MK%PRT%'
        ORDER BY table_name
    """)
    for row in cursor.fetchall():
        print(f"   - {row[0]}")
    
    # 9. 查看 ord_bas 示例数据
    print("\n9. ord_bas 表示例数据 (前 3 条):")
    cursor.execute("SELECT * FROM ord_bas WHERE ROWNUM <= 3")
    cols = [col[0] for col in cursor.description]
    print(f"   字段：{', '.join(cols)}")
    print()
    for row in cursor.fetchall():
        for i, val in enumerate(row):
            print(f"   {cols[i]:<25}: {val}")
        print("   " + "-"*50)
    
    # 10. 查找包含 serial 字段的表（生产单号）
    print("\n10. 查找包含 SERIAL 字段的表:")
    cursor.execute("""
        SELECT table_name, COUNT(*) as col_count
        FROM user_tab_columns 
        WHERE column_name = 'SERIAL'
        GROUP BY table_name
        HAVING COUNT(*) > 0
        ORDER BY table_name
    """)
    for row in cursor.fetchall():
        print(f"   - {row[0]} ({row[1]}个 SERIAL 相关字段)")
    
    cursor.close()
    conn.close()
    print("\n" + "="*80)
    print("探索完成！")
    print("="*80)

if __name__ == "__main__":
    explore_database()
