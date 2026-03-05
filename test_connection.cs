using System;
using Oracle.ManagedDataAccess.Client;

class TestConnection
{
    static void Main(string[] args)
    {
        // 易捷集团数据库连接字符串
        string connString = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp;";

        using (var conn = new OracleConnection(connString))
        {
            conn.Open();
            Console.WriteLine("=== 连接易捷集团数据库成功！===\n");

            // 1. 查询 pb_dept_member 表结构
            Console.WriteLine("=== pb_dept_member 表结构 ===");
            string sql = "SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'PB_DEPT_MEMBER' ORDER BY column_id";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}({reader.GetInt32(2)})");
                }
            }

            // 2. 查询 pb_dept 表结构
            Console.WriteLine("\n=== pb_dept 表结构 ===");
            sql = "SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'PB_DEPT' ORDER BY column_id";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}({reader.GetInt32(2)})");
                }
            }

            // 3. 查询 PB_EMPS 表结构
            Console.WriteLine("\n=== PB_EMPS 表结构 ===");
            sql = "SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'PB_EMPS' ORDER BY column_id";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}({reader.GetInt32(2)})");
                }
            }

            // 4. 测试原始SQL - 查询 pb_dept_member
            Console.WriteLine("\n=== 测试 pb_dept_member 查询 ===");
            sql = "SELECT * FROM pb_dept_member WHERE ROWNUM <= 5";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                if (reader.HasRows)
                {
                    while (reader.Read())
                    {
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            Console.WriteLine($"  {reader.GetName(i)}: {reader.GetValue(i)}");
                        }
                        Console.WriteLine();
                    }
                }
            }

            // 5. 测试 HR_BASE 表结构
            Console.WriteLine("\n=== HR_BASE 表结构 ===");
            sql = "SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'HR_BASE' ORDER BY column_id";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}({reader.GetInt32(2)})");
                }
            }

            // 6. 测试 ORD_BAS 表结构
            Console.WriteLine("\n=== ORD_BAS 表结构 ===");
            sql = "SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'ORD_BAS' ORDER BY column_id";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}({reader.GetInt32(2)})");
                }
            }

            // 7. 测试 ORD_CT 表结构
            Console.WriteLine("\n=== ORD_CT 表结构 ===");
            sql = "SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'ORD_CT' ORDER BY column_id";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}({reader.GetInt32(2)})");
                }
            }

            // 8. 测试 PB_CLNT 表结构
            Console.WriteLine("\n=== PB_CLNT 表结构 ===");
            sql = "SELECT column_name, data_type, data_length FROM user_tab_columns WHERE table_name = 'PB_CLNT' ORDER BY column_id";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}({reader.GetInt32(2)})");
                }
            }

            conn.Close();
        }

        Console.WriteLine("\n按任意键退出...");
        Console.ReadKey();
    }
}
