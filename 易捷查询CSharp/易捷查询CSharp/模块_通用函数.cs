using Com.Ekyb.CrossFactoryOrder.Common;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using ToolGood.ReadyGo3;
using System.ComponentModel;

namespace 易捷查询CSharp
{
    internal class 模块_通用函数
    {
        private const String Ora连接字符串 = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.137.213.189)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=read;Password=ejsh.read;";

        // 易捷集团数据库连接字符串（用于获取部门和业务员数据）
        private const string 易捷集团连接字符串 = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=36.138.130.91)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=dbms)));User Id=fgrp;Password=kuke.fgrp;";

        public static void 初始化日期从 (DateTimePicker 时间器)
        {
            时间器.Value = DateTime.Today;
        }
        public static void 初始化日期到 (DateTimePicker 时间器)
        {
            时间器.Value = DateTime.Today.AddDays(1).AddMilliseconds(-1);
        }

        private static DataTable 私有_部门表;
        private static DataTable 私有_业务员表;
        private static DataTable 私有_跟单员表;

        // 新增：全局业务员字典（从集团数据库加载，只加载一次）
        private static Dictionary<string, empTemp> 全局业务员字典;
        private static bool 已加载集团数据 = false;

        public static DataTable 易捷部门表 ()
        {
            try {
                if (私有_部门表 == null) {
                    var all = get业务员表();
                    Dictionary<string, dptTemp> dict = new Dictionary<string, dptTemp>();
                    foreach (var item in all) {
                        dptTemp dptTemp;
                        if (dict.TryGetValue(item.TEMNME, out dptTemp)) {
                            if (dptTemp.TEMCDE == null) {
                                dptTemp.TEMCDE = item.TEMCDE;
                            }
                            if (dptTemp.TEMCDE2 == null) {
                                dptTemp.TEMCDE2 = item.TEMCDE2;
                            }
                        } else {
                            dict[item.TEMNME] = new dptTemp() {
                                TEMCDE = item.TEMCDE,
                                TEMCDE2 = item.TEMCDE2,
                                TEMNME = item.TEMNME,
                            };
                        }
                    }
                    var list = dict.Select(q => q.Value).OrderBy(q => q.TEMNME).ToList();
                    私有_部门表 = ConvertToDatatable(list);
                }
                return 私有_部门表;
            } catch (Exception ex) {
                MessageBox.Show(ex.Message);
                return null;
            }
        }

        public class dptTemp
        {
            public string TEMCDE { get; set; }
            public string TEMCDE2 { get; set; }
            public string TEMNME { get; set; }
        }
        public class empTemp
        {
            public string EMPCDE { get; set; }
            public string EMPCDE2 { get; set; }
            public string TEMCDE { get; set; }
            public string TEMCDE2 { get; set; }
            public string EMPNME { get; set; }
            public string TEMNME { get; set; }
        }


        public static DataTable 易捷业务员表 ()
        {
            try {
                if (私有_业务员表 == null) {
                    var all = get业务员表();
                    私有_业务员表 = ConvertToDatatable(all);
                }
                return 私有_业务员表;
            } catch (Exception ex) {
                MessageBox.Show(ex.Message);
                return null;
            }
        }
        
        private static List<empTemp> 业务员表;
        
        private static List<empTemp> get业务员表()
        {
            if (业务员表 == null) {
                Dictionary<string, empTemp> dict = new Dictionary<string, empTemp>();

                // 1. 先从易捷集团数据库获取业务员数据
                try {
                    using (var helper = SqlHelperFactory.OpenDatabase(易捷集团连接字符串, SqlType.Oracle)) {
                        // 注意：集团数据库字段名与其他系统不同
                        // pb_dept_member: EMPCDE (不是 user_cde), DPTNME (不是 dept_nme/dept_cde)
                        // pb_dept: DPTCDE (不是 dept_cde), DPTNME (不是 dept_nme)
                        var sql = @"SELECT m.empcde as EMPCDE, m.dptnme as TEMCDE, m.dptnme as TEMCDE2,
                                           m.empnme as EMPNME, d.dptnme as TEMNME
                                    FROM pb_dept_member m
                                    LEFT JOIN pb_dept d ON m.dptnme = d.dptnme
                                    WHERE m.isactive = 'Y'
                                    ORDER BY d.dptnme, m.empnme";
                        var ts = helper.Select<empTemp>(sql);
                        foreach (var t in ts) {
                            if (t.TEMNME == null)
                                continue;
                            // 统一部门名称
                            t.TEMNME = t.TEMNME.Replace("老厂销售", "销售");
                            t.TEMNME = t.TEMNME.Replace("新厂销售", "销售");
                            t.TEMNME = t.TEMNME.Replace("临海销售", "销售");
                            t.TEMNME = t.TEMNME.Replace("温森一期销售", "销售");
                            t.TEMNME = t.TEMNME.Replace("温森二期销售", "销售");

                            empTemp temp;
                            if (dict.TryGetValue(t.TEMNME + "-" + t.EMPNME, out temp)) {
                                if (temp.EMPCDE2 == null || temp.EMPCDE2 == "") {
                                    temp.EMPCDE2 = t.EMPCDE2;
                                }
                                if (temp.EMPCDE == null || temp.EMPCDE == "") {
                                    temp.EMPCDE = t.EMPCDE;
                                }
                                if (temp.TEMCDE2 == null || temp.TEMCDE2 == "") {
                                    temp.TEMCDE2 = t.TEMCDE2;
                                }
                                if (temp.TEMCDE == null || temp.TEMCDE == "") {
                                    temp.TEMCDE = t.TEMCDE;
                                }
                            } else {
                                dict[t.TEMNME + "-" + t.EMPNME] = t;
                            }
                        }
                    }
                } catch (Exception ex) {
                    System.Diagnostics.Debug.WriteLine($"查询易捷集团数据库的业务员表失败：{ex.Message}");
                }

                // 2. 再从各业务数据库补充数据
                foreach (var db in DatabaseInfos.GetDatabaseInfos()) {
                    try {
                        using (var helper = SqlHelperFactory.OpenDatabase(db.GetConnString(), SqlType.Oracle)) {
                            // 新系统：不同子公司可能有不同的表结构
                            if (db.ServerType == "新系统") {
                                // 根据工厂名称选择对应的业务员表
                                if (db.FactoryName == "新厂新系统") {
                                    // 新厂新系统使用 pb_agnt 表
                                    try {
                                        var pbAgntSql = @"
                                            SELECT AGNTCDE as EMPCDE, AGNTCDE as EMPCDE2,
                                                   AGNTNME as EMPNME, DPTCDE as TEMCDE, DPTNME as TEMNME
                                            FROM pb_agnt
                                            WHERE ISACTIVE = 'Y'
                                            ORDER BY DPTNME, AGNTNME";
                                        var ts_agnt = helper.Select<empTemp>(pbAgntSql);
                                        foreach (var t in ts_agnt) {
                                            if (t.TEMNME == null)
                                                continue;
                                            // 统一部门名称
                                            t.TEMNME = t.TEMNME.Replace("老厂销售", "销售");
                                            t.TEMNME = t.TEMNME.Replace("新厂销售", "销售");
                                            t.TEMNME = t.TEMNME.Replace("临海销售", "销售");
                                            t.TEMNME = t.TEMNME.Replace("温森一期销售", "销售");
                                            t.TEMNME = t.TEMNME.Replace("温森二期销售", "销售");

                                            empTemp temp;
                                            if (dict.TryGetValue(t.TEMNME + "-" + t.EMPNME, out temp)) {
                                                if (temp.EMPCDE2 == null || temp.EMPCDE2 == "") {
                                                    temp.EMPCDE2 = t.EMPCDE2;
                                                }
                                                if (temp.EMPCDE == null || temp.EMPCDE == "") {
                                                    temp.EMPCDE = t.EMPCDE;
                                                }
                                                if (temp.TEMCDE == null || temp.TEMCDE == "") {
                                                    temp.TEMCDE = t.TEMCDE;
                                                }
                                            } else {
                                                dict[t.TEMNME + "-" + t.EMPNME] = t;
                                            }
                                        }
                                    } catch (Exception ex) {
                                        System.Diagnostics.Debug.WriteLine($"⚠ 查询 {db.FactoryName} 的 pb_agnt 表失败：{ex.Message}");
                                    }
                                } else {
                                    // 老厂新系统、温森新系统使用 pb_dept_member 表
                                    try {
                                        var pbDeptMemberSql = @"
                                            SELECT m.empcde as EMPCDE, m.empcde as EMPCDE2,
                                                   m.empnme as EMPNME, m.dptnme as TEMNME
                                            FROM pb_dept_member m
                                            WHERE m.isactive = 'Y'
                                            ORDER BY m.dptnme, m.empnme";
                                        var ts_member = helper.Select<empTemp>(pbDeptMemberSql);
                                        foreach (var t in ts_member) {
                                            if (t.TEMNME == null)
                                                continue;
                                            // 统一部门名称
                                            t.TEMNME = t.TEMNME.Replace("老厂销售", "销售");
                                            t.TEMNME = t.TEMNME.Replace("新厂销售", "销售");
                                            t.TEMNME = t.TEMNME.Replace("临海销售", "销售");
                                            t.TEMNME = t.TEMNME.Replace("温森一期销售", "销售");
                                            t.TEMNME = t.TEMNME.Replace("温森二期销售", "销售");

                                            empTemp temp;
                                            if (dict.TryGetValue(t.TEMNME + "-" + t.EMPNME, out temp)) {
                                                if (temp.EMPCDE2 == null || temp.EMPCDE2 == "") {
                                                    temp.EMPCDE2 = t.EMPCDE2;
                                                }
                                                if (temp.EMPCDE == null || temp.EMPCDE == "") {
                                                    temp.EMPCDE = t.EMPCDE;
                                                }
                                            } else {
                                                dict[t.TEMNME + "-" + t.EMPNME] = t;
                                            }
                                        }
                                    } catch (Exception ex) {
                                        System.Diagnostics.Debug.WriteLine($"⚠ 查询 {db.FactoryName} 的 pb_dept_member 表失败：{ex.Message}");
                                    }
                                }
                            } else {
                                // 旧系统使用 pb_emps 表
                                var sql = "select EMPCDE, TEMCDE, EMPNME, TEMNME from pb_emps where objtyp ='AG' order by TEMNME";
                                var ts = helper.Select<empTemp>(sql);
                                foreach (var t in ts) {
                                    if (t.TEMNME == null)
                                        continue;
                                    t.TEMNME = t.TEMNME.Replace("老厂销售", "销售");
                                    t.TEMNME = t.TEMNME.Replace("新厂销售", "销售");
                                    t.TEMNME = t.TEMNME.Replace("临海销售", "销售");
                                    t.TEMNME = t.TEMNME.Replace("温森一期销售", "销售");
                                    t.TEMNME = t.TEMNME.Replace("温森二期销售", "销售");

                                    empTemp temp;
                                    if (dict.TryGetValue(t.TEMNME + "-" + t.EMPNME, out temp)) {
                                        if (temp.EMPCDE2 == null || temp.EMPCDE2 == "") {
                                            temp.EMPCDE2 = t.EMPCDE2;
                                        }
                                        if (temp.EMPCDE == null || temp.EMPCDE == "") {
                                            temp.EMPCDE = t.EMPCDE;
                                        }
                                        if (temp.TEMCDE2 == null || temp.TEMCDE2 == "") {
                                            temp.TEMCDE2 = t.TEMCDE2;
                                        }
                                    } else {
                                        dict[t.TEMNME + "-" + t.EMPNME] = t;
                                    }
                                }
                            }
                        }
                    } catch (Exception ex) {
                        System.Diagnostics.Debug.WriteLine($"⚠ 查询数据库 {db.FactoryName} 的业务员表失败：{ex.Message}");
                    }
                }
                业务员表 = dict.Select(q => q.Value).OrderBy(q => q.TEMNME).ToList();
            }
            return 业务员表;
        }



        /// <summary>
        /// 从易捷集团数据库加载所有业务员到内存（只加载一次）
        /// </summary>
        public static void 加载集团业务员数据()
        {
            if (已加载集团数据) return;  // 只加载一次

            全局业务员字典 = new Dictionary<string, empTemp>();

            using (var helper = SqlHelperFactory.OpenDatabase(易捷集团连接字符串, SqlType.Oracle))
            {
                // 从集团数据库查询所有业务员
                // 注意：集团数据库字段名与其他系统不同
                var sql = @"SELECT m.empcde as EMPCDE,
                                   m.dptnme as TEMCDE,
                                   m.dptnme as TEMCDE2,
                                   m.empnme as EMPNME,
                                   d.dptnme as TEMNME
                            FROM pb_dept_member m
                            LEFT JOIN pb_dept d ON m.dptnme = d.dptnme
                            WHERE m.isactive = 'Y'
                            ORDER BY d.dptnme, m.empnme";

                var emps = helper.Select<empTemp>(sql);
                foreach (var emp in emps)
                {
                    if (string.IsNullOrEmpty(emp.EMPCDE)) continue;

                    // 统一部门名称
                    if (!string.IsNullOrEmpty(emp.TEMNME))
                    {
                        emp.TEMNME = emp.TEMNME.Replace("老厂销售", "销售")
                                               .Replace("新厂销售", "销售")
                                               .Replace("临海销售", "销售")
                                               .Replace("温森一期销售", "销售")
                                               .Replace("温森二期销售", "销售");
                    }

                    // 以 EMPCDE 为 key 存入字典
                    全局业务员字典[emp.EMPCDE] = emp;
                }
            }

            已加载集团数据 = true;
            System.Diagnostics.Debug.WriteLine($"✓ 从集团数据库加载了 {全局业务员字典.Count} 名业务员");
        }

        /// <summary>
        /// 根据业务员编码获取业务员信息，如果不存在则自动创建临时记录
        /// </summary>
        public static empTemp 获取业务员信息(string 业务员编码)
        {
            // 确保已加载集团数据
            加载集团业务员数据();

            // 如果存在，直接返回
            if (全局业务员字典.TryGetValue(业务员编码, out var emp))
            {
                return emp;
            }

            // 不存在，创建一个临时记录（用手机号作为名字显示）
            var 临时业务员 = new empTemp
            {
                EMPCDE = 业务员编码,
                EMPCDE2 = 业务员编码,
                EMPNME = 业务员编码,  // 用手机号作为名字显示
                TEMNME = "未知部门",
                TEMCDE = "",
                TEMCDE2 = ""
            };

            // 添加到字典中，避免重复创建
            全局业务员字典[业务员编码] = 临时业务员;

            System.Diagnostics.Debug.WriteLine($"⚠ 补充临时业务员记录：[{业务员编码}]");

            return 临时业务员;
        }

        /// <summary>
        /// 检查业务员是否存在（不自动创建）
        /// </summary>
        public static bool 业务员是否存在(string 业务员编码)
        {
            加载集团业务员数据();
            return 全局业务员字典.ContainsKey(业务员编码);
        }

        public static DataTable 易捷跟单员表 ()
        {
            try {
                if (私有_跟单员表 == null) {
                    私有_跟单员表 = Ora数据表请求("select EMPCDE, TEMCDE, EMPNME, TEMNME from pb_emps where objtyp ='AS' order by TEMNME");
                }
                return 私有_跟单员表;
            } catch (Exception ex) {
                MessageBox.Show(ex.Message);
                return null;
            }
        }
        
        public static DataTable Ora数据表请求(string sql)
        {
            try {
                using (var helper = SqlHelperFactory.OpenDatabase(Ora连接字符串, SqlType.Oracle)) {
                    return helper.ExecuteDataTable(sql);
                }
            } catch (Exception ex) {
                MessageBox.Show(ex.Message);
                return null;
            }
        }

        public static DataTable ConvertToDatatable<T>(List<T> data)
        {
            PropertyDescriptorCollection properties = TypeDescriptor.GetProperties(typeof(T));
            DataTable dataTable = new DataTable();
            for (int i = 0; i < properties.Count; i++) {
                PropertyDescriptor propertyDescriptor = properties[i];
                if (propertyDescriptor.PropertyType.IsGenericType && propertyDescriptor.PropertyType.GetGenericTypeDefinition() == typeof(Nullable<>)) {
                    dataTable.Columns.Add(propertyDescriptor.Name, propertyDescriptor.PropertyType.GetGenericArguments()[0]);
                } else {
                    dataTable.Columns.Add(propertyDescriptor.Name, propertyDescriptor.PropertyType);
                }
            }
            object[] array = new object[properties.Count];
            foreach (T t in data) {
                for (int i = 0; i < array.Length; i++) {
                    array[i] = properties[i].GetValue(t);
                }
                dataTable.Rows.Add(array);
            }
            return dataTable;
        }

    }
}
