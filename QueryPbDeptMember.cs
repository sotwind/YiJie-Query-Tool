using System;
using System.Data;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;

namespace QueryPbDeptMember
{
    class Program
    {
        static void Main(string[] args)
        {
            // 易捷集团数据库（用于查询部门和业务员数据）
            string connStringFgrp = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp";
            
            // 老厂新系统（用于对比）
            string connStringFerp = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.132.30)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=read;Password=ejsh.read";

            Console.WriteLine("=" + new string('=', 119) + "=");
            Console.WriteLine("查询 pb_dept_member 表完整结构");
            Console.WriteLine("=" + new string('=', 119) + "=");

            // 查询易捷集团数据库
            CheckTableStructure(connStringFgrp, "易捷集团 (fgrp)");
            
            // 查询老厂新系统数据库
            CheckTableStructure(connStringFerp, "老厂新系统 (ferp)");
            
            Console.WriteLine("\n" + "=" + new string('=', 119) + "=");
            Console.WriteLine("查询完成！");
            Console.WriteLine("=" + new string('=', 119) + "=");
            Console.WriteLine("\n按任意键退出...");
            Console.ReadKey();
        }

        static void CheckTableStructure(string connString, string dbName)
        {
            Console.WriteLine($"\n{'='*80}");
            Console.WriteLine($"数据库：{dbName}");
            Console.WriteLine($"{'='*80}");
            
            try
            {
                using (OracleConnection conn = new OracleConnection(connString))
                {
                    conn.Open();
                    Console.WriteLine($"✓ 连接成功！");

                    using (OracleCommand cmd = new OracleCommand())
                    {
                        cmd.Connection = conn;
                        
                        // 检查表是否存在
                        cmd.CommandText = @"
                            SELECT table_name 
                            FROM all_tables 
                            WHERE table_name = 'PB_DEPT_MEMBER'
                        ";
                        var tableResult = cmd.ExecuteScalar();
                        
                        if (tableResult == null)
                        {
                            Console.WriteLine($"⚠️  表 PB_DEPT_MEMBER 在 {dbName} 中不存在");
                            return;
                        }
                        
                        Console.WriteLine($"✓ 表 PB_DEPT_MEMBER 存在于 {dbName}");
                        
                        // 查询表的详细结构
                        cmd.CommandText = @"
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
                        ";
                        
                        using (OracleDataReader reader = cmd.ExecuteReader())
                        {
                            Console.WriteLine($"\n{'序号',-6} {'字段名',-25} {'类型',-15} {'长度',6} {'精度',6} {'小数',4} {'可空',-6} {'注释'}");
                            Console.WriteLine(new string('-', 110));
                            
                            while (reader.Read())
                            {
                                string colName = reader.GetString(0);
                                string dataType = reader.GetString(1);
                                int dataLength = reader.IsDBNull(2) ? 0 : reader.GetInt32(2);
                                int? dataPrecision = reader.IsDBNull(3) ? (int?)null : reader.GetInt32(3);
                                int? dataScale = reader.IsDBNull(4) ? (int?)null : reader.GetInt32(4);
                                string nullable = reader.GetString(5);
                                int columnId = reader.GetInt32(6);
                                string comments = reader.IsDBNull(7) ? "" : reader.GetString(7);
                                
                                Console.WriteLine($"{columnId,-6} {colName,-25} {dataType,-15} {dataLength,6} {dataPrecision?.ToString() ?? "",6} {dataScale?.ToString() ?? "",4} {nullable,-6} {comments}");
                            }
                        }
                        
                        // 查询示例数据
                        Console.WriteLine($"\n示例数据（前 5 条）:");
                        cmd.CommandText = "SELECT * FROM PB_DEPT_MEMBER WHERE ROWNUM <= 5";
                        
                        using (OracleDataReader reader = cmd.ExecuteReader())
                        {
                            var colNames = new List<string>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                colNames.Add(reader.GetName(i));
                            }
                            
                            Console.WriteLine($"\n{'字段',-25} {'示例值 1',-30} {'示例值 2',-30}");
                            Console.WriteLine(new string('-', 85));
                            
                            var rows = new List<OracleDataReader>();
                            int rowCount = 0;
                            while (reader.Read() && rowCount < 5)
                            {
                                rows.Add(reader);
                                rowCount++;
                            }
                            
                            for (int i = 0; i < colNames.Count; i++)
                            {
                                string colName = colNames[i];
                                string val1 = (rows.Count > 0 && !rows[0].IsDBNull(i)) ? rows[0].GetValue(i).ToString() : "NULL";
                                string val2 = (rows.Count > 1 && !rows[1].IsDBNull(i)) ? rows[1].GetValue(i).ToString() : "NULL";
                                Console.WriteLine($"{colName,-25} {val1,-30} {val2,-30}");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ 错误：{ex.Message}");
                Console.WriteLine($"详细信息：{ex.InnerException?.Message ?? "无"}");
            }
        }
    }
}
