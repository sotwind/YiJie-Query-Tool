using System;
using System.Data;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;

namespace OracleQuery
{
    class Program
    {
        static void Main(string[] args)
        {
            string connString = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp";

            using (OracleConnection conn = new OracleConnection(connString))
            {
                try
                {
                    conn.Open();
                    Console.WriteLine("连接成功！");

                    // 查询所有表名
                    string sqlTables = "SELECT table_name FROM user_tables ORDER BY table_name";
                    using (OracleCommand cmd = new OracleCommand(sqlTables, conn))
                    using (OracleDataReader reader = cmd.ExecuteReader())
                    {
                        Console.WriteLine("\n所有表名：");
                        List<string> tables = new List<string>();
                        while (reader.Read())
                        {
                            string tableName = reader.GetString(0);
                            tables.Add(tableName);
                            Console.WriteLine(tableName);
                        }

                        // 查找可能包含箱型信息的表
                        Console.WriteLine("\n\n可能包含箱型信息的表：");
                        foreach (var table in tables)
                        {
                            string lowerTable = table.ToLower();
                            if (lowerTable.Contains("box") || lowerTable.Contains("箱") || 
                                lowerTable.Contains("carton") || lowerTable.Contains("pack") ||
                                lowerTable.Contains("type") || lowerTable.Contains("规格") ||
                                lowerTable.Contains("formula") || lowerTable.Contains("公式"))
                            {
                                Console.WriteLine($"  {table}");
                            }
                        }
                    }

                    // 查询可能相关的表的列信息
                    Console.WriteLine("\n\n查询可能相关表的列结构：");
                    string[] possibleTables = { "PB_BOX", "PB_CARTON", "PB_PACK", "PB_TYPE", "PB_FORMULA", "PB_BOXTYPE" };
                    
                    foreach (var tableName in possibleTables)
                    {
                        string sqlColumns = $"SELECT column_name, data_type FROM user_tab_columns WHERE table_name = '{tableName.ToUpper()}' ORDER BY column_id";
                        try
                        {
                            using (OracleCommand cmd = new OracleCommand(sqlColumns, conn))
                            using (OracleDataReader reader = cmd.ExecuteReader())
                            {
                                if (reader.HasRows)
                                {
                                    Console.WriteLine($"\n表 {tableName} 的列结构：");
                                    while (reader.Read())
                                    {
                                        Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}");
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            // 表不存在，跳过
                        }
                    }

                    // 查询包含"BOX"或"箱"的表
                    Console.WriteLine("\n\n搜索包含BOX或箱的表：");
                    string sqlSearch = "SELECT table_name FROM user_tables WHERE UPPER(table_name) LIKE '%BOX%' OR UPPER(table_name) LIKE '%CARTON%' ORDER BY table_name";
                    using (OracleCommand cmd = new OracleCommand(sqlSearch, conn))
                    using (OracleDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            string tableName = reader.GetString(0);
                            Console.WriteLine($"  找到表: {tableName}");
                            
                            // 显示该表的列信息
                            string sqlColumns = $"SELECT column_name, data_type FROM user_tab_columns WHERE table_name = '{tableName}' ORDER BY column_id";
                            using (OracleCommand cmd2 = new OracleCommand(sqlColumns, conn))
                            using (OracleDataReader reader2 = cmd2.ExecuteReader())
                            {
                                Console.WriteLine("    列结构：");
                                while (reader2.Read())
                                {
                                    Console.WriteLine($"      {reader2.GetString(0)} - {reader2.GetString(1)}");
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"错误: {ex.Message}");
                }
            }

            Console.WriteLine("\n按任意键退出...");
            Console.ReadKey();
        }
    }
}
