using Com.Ekyb.CrossFactoryOrder.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using ToolGood.ReadyGo3;

namespace 易捷查询CSharp
{
    public partial class 窗体_利润统计 : Form
    {
        public 窗体_利润统计()
        {
            InitializeComponent();
        }

        private void 窗体_利润统计_Load(object sender, EventArgs e)
        {
            模块_通用函数.初始化日期从 (日期_从);
            模块_通用函数.初始化日期到 (日期_到);

            try
            {
                列表_部门.DataSource = 模块_通用函数.易捷部门表 ();
                列表_部门.DisplayMember = "TEMNME";
                列表_部门.ValueMember = "TEMCDE";

                // 调试：输出部门编码信息
                var 部门表 = 模块_通用函数.易捷部门表 ();
                System.Diagnostics.Debug.WriteLine("=== 部门表数据 ===");
                foreach (System.Data.DataRow row in 部门表.Rows) {
                    System.Diagnostics.Debug.WriteLine($"部门名称：{row["TEMNME"]}, 部门编码 (TEMCDE): {row["TEMCDE"]}, 部门编码 2(TEMCDE2): {row["TEMCDE2"]}");
                }

                列表_业务员.DataSource = 模块_通用函数.易捷业务员表 ().DefaultView;
                列表_业务员.DisplayMember = "EMPNME";
                列表_业务员.ValueMember = "EMPCDE";

                数值_利率从.Value = -100000;
                数值_利率到.Value = 100000;
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        private void 按钮_查询_Click(object sender, EventArgs e)
        {
            try
            {
                列表_查询结果.Items.Clear();

                string sql = BuildQueryString();

                // 调试：输出 SQL 和筛选条件
                System.Diagnostics.Debug.WriteLine("=== 查询 SQL ===");
                System.Diagnostics.Debug.WriteLine(sql);
                System.Diagnostics.Debug.WriteLine($"部门勾选数量：{列表_部门.CheckedItems.Count}");
                System.Diagnostics.Debug.WriteLine($"业务员勾选数量：{列表_业务员.CheckedItems.Count}");
                foreach (DataRowView rowview in 列表_部门.CheckedItems) {
                    System.Diagnostics.Debug.WriteLine($"勾选的部门：名称={rowview["TEMNME"]}, 编码 (TEMCDE)={rowview["TEMCDE"]}, 编码 2(TEMCDE2)={rowview["TEMCDE2"]}");
                }

                List<利润统计数据> profitDataList = new List<利润统计数据>();

                foreach (var db in DatabaseInfos.GetDatabaseInfos())
                {
                    if (db.ServerType != "新系统")
                        continue;

                    try
                    {
                        using (var helper = SqlHelperFactory.OpenDatabase(db.GetConnString(), SqlType.Oracle))
                        {
                            var list = helper.Select<利润统计数据>(sql);
                            profitDataList.AddRange(list);
                        }
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show(db.FactoryName + " 连接出错了：" + ex.Message);
                    }
                }

                显示结果 (profitDataList);
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
            }
        }

        private string BuildQueryString()
        {
            string sql = @"
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    h.empnme as 业务员，
    d.dptnme as 部门，
    nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 报价总金额，
    nvl(b.accamt, 0) as 卖价总金额，
    nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0) as 利润差额，
    case 
        when nvl(b.quoprc, 0) * nvl(b.accnum, 0) = 0 then 0
        else (nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) / (nvl(b.quoprc, 0) * nvl(b.accnum, 0)) * 100
    end as 利率
FROM ord_bas b
LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ord_ct t ON b.serial = t.serial
LEFT JOIN hr_base h ON t.agntcde = h.mobile
LEFT JOIN pb_dept d ON h.dptcde = d.dptcde
WHERE b.isactive = 'Y'
  AND b.created >= to_date('" + 日期_从.Value.Date.ToString("yyyy-MM-dd") + "', 'yyyy-MM-dd')" +
            @"  AND b.created < to_date('" + 日期_到.Value.Date.AddDays(1).ToString("yyyy-MM-dd") + "', 'yyyy-MM-dd')";

            if (列表_部门.CheckedItems.Count > 0)
            {
                string tmpstr = "";
                foreach (DataRowView rowview in 列表_部门.CheckedItems)
                {
                    string 部门编码 = rowview["TEMCDE"].ToString();
                    if (部门编码 != "" && 部门编码 != null)
                    {
                        if (tmpstr != "") tmpstr += ",";
                        tmpstr += "'" + 部门编码 + "'";
                    }
                }

                if (tmpstr != "")
                {
                    sql += @" AND d.dptcde IN (" + tmpstr + @")";
                }
            }

            if (列表_业务员.CheckedItems.Count > 0)
            {
                string tmpstr = "";
                foreach (DataRowView rowview in 列表_业务员.CheckedItems)
                {
                    string 业务员编码 = rowview["EMPCDE"].ToString();
                    if (业务员编码 != "" && 业务员编码 != null)
                    {
                        if (tmpstr != "") tmpstr += ",";
                        tmpstr += "'" + 业务员编码 + "'";
                    }
                }

                if (tmpstr != "")
                {
                    sql += @" AND h.mobile IN (" + tmpstr + @")";
                }
            }

            if (文本_客户.Text.Trim() != "")
            {
                sql += @" AND c.clntnme LIKE '%" + 文本_客户.Text.Trim() + "%'";
            }

            if (文本_单号.Text.Trim() != "")
            {
                sql += @" AND b.serial LIKE '%" + 文本_单号.Text.Trim() + "%'";
            }

            if (文本_产品.Text.Trim() != "")
            {
                sql += @" AND b.prdnme LIKE '%" + 文本_产品.Text.Trim() + "%'";
            }

            // 利率筛选使用 ord_bas 表的字段计算，因为 ord_ct 没有 quoprc 字段
            sql += @" AND (
                case 
                    when nvl(b.quoprc, 0) * nvl(b.accnum, 0) = 0 then 0
                    else (nvl(b.accamt, 0) - nvl(b.quoprc, 0) * nvl(b.accnum, 0)) / (nvl(b.quoprc, 0) * nvl(b.accnum, 0)) * 100
                end
            ) BETWEEN " + 数值_利率从.Value.ToString() + " AND " + 数值_利率到.Value.ToString();

            return sql;
        }

        private void 显示结果 (List<利润统计数据> 利润列表)
        {
            decimal 总报价 = 0;
            decimal 总卖价 = 0;
            decimal 总利润 = 0;
            int 总单数 = 0;
            decimal 平均利率 = 0;

            foreach (var item in 利润列表)
            {
                var 列项 = 列表_查询结果.Items.Add(item.日期);
                列项.SubItems.Add(item.单号);
                列项.SubItems.Add(item.客户);
                列项.SubItems.Add(item.产品);
                列项.SubItems.Add(item.业务员);
                列项.SubItems.Add(item.部门);
                列项.SubItems.Add(item.报价金额.ToString("0.00"));
                列项.SubItems.Add(item.卖价金额.ToString("0.00"));
                列项.SubItems.Add(item.利润差额.ToString("0.00"));
                列项.SubItems.Add(item.利率.ToString("0.00"));

                总报价 += item.报价金额;
                总卖价 += item.卖价金额;
                总利润 += item.利润差额;
                总单数++;
            }

            if (总报价 != 0)
            {
                平均利率 = (总利润 / 总报价) * 100;
            }

            标签_总单数.Text = 总单数.ToString();
            标签_总报价.Text = 总报价.ToString("0.00");
            标签_总卖价.Text = 总卖价.ToString("0.00");
            标签_总利润.Text = 总利润.ToString("0.00");
            标签_平均利率.Text = 平均利率.ToString("0.00") + "%";
        }

        private void 按钮_导出_Click(object sender, EventArgs e)
        {
            try
            {
                ExcelControl.ExportExcel.ListViewtoExcel(列表_查询结果);
            }
            catch (Exception ex)
            {
                MessageBox.Show("导出失败：" + ex.Message);
            }
        }

        private void 列表_部门_ItemCheck(object sender, ItemCheckEventArgs e)
        {
            var count = 列表_部门.CheckedItems.Count;
            var 当前项 = 列表_部门.SelectedIndex;
            var 当前状态 = 列表_部门.GetItemChecked(当前项);
            if (当前状态) {
                count -= 1;
            } else {
                count += 1;
            }
            if (count > 0) {
                var tmpstr = "";
                for (int i = 0; i < 列表_部门.Items.Count; i++) {
                    var 该项状态 = 列表_部门.GetItemChecked(i);
                    if (i == 当前项) 该项状态 = !该项状态;
                    if (该项状态 == true) {
                        if (tmpstr != "") {
                            tmpstr += ",";
                        }
                        tmpstr += "'" + 列表_部门.GetItemText(列表_部门.Items[i]) + "'";
                    }
                }
                模块_通用函数.易捷业务员表().DefaultView.RowFilter = "TEMNME in (" + tmpstr + ")";
            } else {
                模块_通用函数.易捷业务员表().DefaultView.RowFilter = "";
            }
        }

        public class 利润统计数据
        {
            public string 日期 { get; set; }
            public string 单号 { get; set; }
            public string 客户 { get; set; }
            public string 产品 { get; set; }
            public string 业务员 { get; set; }
            public string 部门 { get; set; }
            public decimal 报价金额 { get; set; }
            public decimal 卖价金额 { get; set; }
            public decimal 利润差额 { get; set; }
            public decimal 利率 { get; set; }
        }
    }
}

