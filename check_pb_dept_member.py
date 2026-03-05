#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""查询 pb_dept_member 表的完整表结构"""

import cx_Oracle
import os

# 设置 Oracle 客户端路径（根据实际环境调整）
# os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/oracle_instantclient/instantclient_21_1')

# 易捷集团数据库（用于查询部门和业务员数据）
DB_CONFIG_FGRP = {
    "host": "36.138.130.91", 
    "port": 1521, 
    "service": "dbms", 
    "user": "fgrp", 
    "password": "kuke.fgrp"
}

# 老厂新系统（用于对比）
DB_CONFIG_FERP = {
    "host": "36.138.132.30", 
    "port": 1521, 
    "service": "dbms", 
    "user": "read", 
    "password": "ejsh.read"
}

def check_table_structure(db_config, db_name):
    """查询表结构"""
    print(f"\n{'='*80}")
    print(f"数据库：{db_name}")
    print(f"{'='*80}")
    
    try:
        dsn = cx_Oracle.makedsn(db_config['host'], db_config['port'], service_name=db_config['service'])
        conn = cx_Oracle.connect(user=db_config['user'], password=db_config['password'], dsn=dsn)
        cursor = conn.cursor()
        
        # 检查表是否存在
        cursor.execute("""
            SELECT table_name 
            FROM all_tables 
            WHERE table_name = 'PB_DEPT_MEMBER'
        """)
        tables = cursor.fetchall()
        
        if not tables:
            print(f"⚠️  表 PB_DEPT_MEMBER 在 {db_name} 中不存在")
            cursor.close()
            conn.close()
            return
        
        print(f"✓ 表 PB_DEPT_MEMBER 存在于 {db_name}")
        
        # 查询表的详细结构
        cursor.execute("""
            SELECT 
                column_name, 
                data_type, 
                data_length, 
                data_precision,
                data_scale,
                nullable,
                column_id,
                comments
            FROM all_tab_columns c
            LEFT JOIN all_col_comments m 
                ON c.owner = m.owner 
                AND c.table_name = m.table_name 
                AND c.column_name = m.column_name
            WHERE c.table_name = 'PB_DEPT_MEMBER'
            ORDER BY c.column_id
        """)
        
        cols = cursor.fetchall()
        
        print(f"\n{'序号':<6} {'字段名':<25} {'类型':<15} {'长度':>6} {'精度':>6} {'小数':>4} {'可空':<6} {'注释'}")
        print(f"{'-'*110}")
        
        for row in cols:
            col_name = row[0]
            data_type = row[1]
            data_length = row[2] if row[2] else ''
            data_precision = row[3] if row[3] else ''
            data_scale = row[4] if row[4] else ''
            nullable = 'Y' if row[5] == 'Y' else 'N'
            column_id = row[6]
            comments = row[7] if row[7] else ''
            
            print(f"{column_id:<6} {col_name:<25} {data_type:<15} {str(data_length):>6} {str(data_precision):>6} {str(data_scale):>4} {nullable:<6} {comments}")
        
        # 查询示例数据
        print(f"\n示例数据（前 5 条）:")
        cursor.execute("""
            SELECT * FROM PB_DEPT_MEMBER WHERE ROWNUM <= 5
        """)
        
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        
        print(f"{'字段':<25} {'示例值 1':<30} {'示例值 2':<30}")
        print(f"{'-'*85}")
        
        for i, col_name in enumerate(col_names):
            val1 = str(rows[0][i]) if len(rows) > 0 and rows[0][i] else 'NULL'
            val2 = str(rows[1][i]) if len(rows) > 1 and rows[1][i] else 'NULL'
            print(f"{col_name:<25} {val1:<30} {val2:<30}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ 错误：{e}")

def main():
    print("="*80)
    print("查询 pb_dept_member 表完整结构")
    print("="*80)
    
    # 查询易捷集团数据库
    check_table_structure(DB_CONFIG_FGRP, "易捷集团 (fgrp)")
    
    # 查询老厂新系统数据库
    check_table_structure(DB_CONFIG_FERP, "老厂新系统 (ferp)")
    
    print(f"\n{'='*80}")
    print("查询完成！")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
