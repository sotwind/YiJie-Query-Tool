#!/usr/bin/env python3
"""
验证易捷数据库表结构
使用 cx_Oracle 库连接 Oracle 数据库
"""

import cx_Oracle
import sys

# 数据库连接配置
DB_CONFIG = {
    "host": "36.138.130.91",
    "port": 1521,
    "service": "dbms",
    "user": "fgrp",
    "password": "kuke.fgrp"
}

def connect_db():
    """连接数据库"""
    try:
        dsn = cx_Oracle.makedsn(DB_CONFIG["host"], DB_CONFIG["port"], service_name=DB_CONFIG["service"])
        conn = cx_Oracle.connect(user=DB_CONFIG["user"], password=DB_CONFIG["password"], dsn=dsn)
        print("✓ 连接成功！")
        return conn
    except Exception as e:
        print(f"✗ 连接失败: {e}")
        sys.exit(1)

def describe_table(conn, table_name):
    """描述表结构"""
    print(f"\n{'='*60}")
    print(f"表: {table_name}")
    print(f"{'='*60}")
    
    cursor = conn.cursor()
    
    # 查询表结构
    sql = """
        SELECT 
            column_name, 
            data_type, 
            data_length,
            data_precision,
            nullable,
            column_id
        FROM user_tab_columns
        WHERE table_name = :table_name
        ORDER BY column_id
    """
    
    cursor.execute(sql, table_name=table_name)
    
    columns = cursor.fetchall()
    if not columns:
        print(f"  表 {table_name} 不存在或无法访问")
        return
    
    print(f"\n{'序号':<5} {'字段名':<25} {'类型':<15} {'长度':<8} {'精度':<8} {'可空':<6}")
    print("-" * 65)
    
    for col in columns:
        col_name, data_type, data_length, data_precision, nullable, col_id = col
        print(f"{col_id:<5} {col_name:<25} {data_type:<15} {str(data_length):<8} {str(data_precision or ''):<8} {nullable:<6}")
    
    # 查询示例数据
    sql = f"SELECT * FROM {table_name} WHERE ROWNUM <= 3"
    cursor.execute(sql)
    rows = cursor.fetchall()
    
    if rows:
        print(f"\n示例数据 (前 {len(rows)} 条):")
        for i, row in enumerate(rows, 1):
            print(f"\n第 {i} 条记录:")
            for j, col in enumerate(columns):
                col_name = col[0]
                value = row[j]
                print(f"  {col_name}: {value}")
    
    cursor.close()

def main():
    print("="*60)
    print("验证易捷数据库表结构")
    print("="*60)
    
    conn = connect_db()
    
    # 需要验证的表
    tables = [
        "PB_DEPT_MEMBER",
        "PB_DEPT",
        "PB_EMPS",
        "ORD_BAS",
        "ORD_CT",
        "PB_CLNT",
        "HR_BASE",
        "SYS_USER"
    ]
    
    for table in tables:
        try:
            describe_table(conn, table)
        except Exception as e:
            print(f"\n✗ 查询表 {table} 失败: {e}")
    
    conn.close()
    print(f"\n{'='*60}")
    print("验证完成！")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
