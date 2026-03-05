using System;
using Oracle.ManagedDataAccess.Client;

class CheckSchema
{
    static void Main(string[] args)
    {
        string connString = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp;";

        using (var conn = new OracleConnection(connString))
        {
            conn.Open();
            Console.WriteLine("连接成功！\n");

            // 查询表结构
            string sql = "SELECT column_name, data_type FROM user_tab_columns WHERE table_name = 'PB_DEPT_MEMBER' ORDER BY column_id";
            using (var cmd = new OracleCommand(sql, conn))
            using (var reader = cmd.ExecuteReader())
            {
                Console.WriteLine("PB_DEPT_MEMBER 表字段：");
                while (reader.Read())
                {
                    Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}");
                }
            }

            // 尝试不同字段组合
            string[][] fieldTests = {
                new string[] {"user_cde", "user_nme"},
                new string[] {"user_code", "user_name"},
                new string[] {"empcde", "empnme"},
                new string[] {"emp_code", "emp_name"}
            };

            foreach (var fields in fieldTests)
            {
                try
                {
                    string sqlTest = $"SELECT {fields[0]}, {fields[1]} FROM pb_dept_member WHERE ROWNUM <= 2";
                    using (var cmd = new OracleCommand(sqlTest, conn))
                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.HasRows)
                        {
                            Console.WriteLine($"\n✓ {fields[0]}, {fields[1]} 查询成功");
                            while (reader.Read())
                            {
                                Console.WriteLine($"  {reader.GetString(0)} - {reader.GetString(1)}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"\n✗ {fields[0]}, {fields[1]} 错误: {ex.Message}");
                }
            }

            // 查询所有字段名
            try
            {
                string sqlAll = "SELECT * FROM pb_dept_member WHERE ROWNUM <= 2";
                using (var cmd = new OracleCommand(sqlAll, conn))
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.HasRows)
                    {
                        Console.WriteLine("\n✓ SELECT * 查询成功");
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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n✗ SELECT * 错误: {ex.Message}");
            }
        }
    }
}
