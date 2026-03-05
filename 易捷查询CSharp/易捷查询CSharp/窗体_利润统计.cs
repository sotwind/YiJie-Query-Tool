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

                列表_业务员.DataSource = 模块_通用函数.易捷业务员表 ();
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
            // 修复后的SQL：使用正确的字段名关联 pb_dept_member 表
            // quoprc = 报价单价, prices = 销售单价
            string sql = @"
SELECT 
    TO_CHAR(b.created, 'yyyy-MM-dd') as 日期，
    b.serial as 单号，
    c.clntnme as 客户，
    b.prdnme as 产品，
    e.empnme as 业务员，
    d.dptnme as 部门，
    NVL(b.quoprc, 0) as 报价金额，
    NVL(b.prices, 0) as 卖价金额，
    NVL(b.prices, 0) - NVL(b.quoprc, 0) as 利润差额，
    CASE 
        WHEN NVL(b.quoprc, 0) = 0 THEN NULL
        ELSE ROUND((NVL(b.prices, 0) - NVL(b.quoprc, 0)) / NVL(b.quoprc, 0) * 100, 2)
    END as 利率
FROM ord_bas b
LEFT JOIN pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ord_ct t ON b.serial = t.serial
LEFT JOIN pb_dept_member e ON t.agntcde = e.empcde
LEFT JOIN pb_dept d ON e.dept_cde = d.dept_cde
WHERE b.isactive = 'Y'
  AND b.created >= to_date('" + 日期_从.Value.Date.ToString("yyyy-MM-dd") + "', 'yyyy-MM-dd')" +
            @"  AND b.created < to_date('" + 日期_到.Value.Date.AddDays(1).ToString("yyyy-MM-dd") + "', 'yyyy-MM-dd')";

            // 部门筛选 - 使用 dept_cde 字段
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
                    sql += @" AND e.dept_cde IN (" + tmpstr + @")";
                }
            }

            // 业务员筛选 - 直接使用 agntcde
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
                    sql += @" AND t.agntcde IN (" + tmpstr + @")";
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

            sql += @" ORDER BY b.created DESC";

            return sql;
        }

        private void 显示结果(List<利润统计数据> dataList)
        {
            列表_查询结果.Items.Clear();

            foreach (var item in dataList)
            {
                // 利率筛选
                if (item.利率 < 数值_利率从.Value || item.利率 > 数值_利率到.Value)
                    continue;

                ListViewItem lvItem = new ListViewItem(item.日期);
                lvItem.SubItems.Add(item.单号);
                lvItem.SubItems.Add(item.客户);
                lvItem.SubItems.Add(item.产品);
                lvItem.SubItems.Add(item.业务员);
                lvItem.SubItems.Add(item.部门);
                lvItem.SubItems.Add(item.报价金额.ToString("0.00"));
                lvItem.SubItems.Add(item.卖价金额.ToString("0.00"));
                lvItem.SubItems.Add(item.利润差额.ToString("0.00"));
                lvItem.SubItems.Add(item.利率.ToString("0.00") + "%");

                列表_查询结果.Items.Add(lvItem);
            }

            // 添加汇总行
            if (dataList.Count > 0)
            {
                decimal 总报价 = dataList.Sum(x => x.报价金额);
                decimal 总卖价 = dataList.Sum(x => x.卖价金额);
                decimal 总利润 = dataList.Sum(x => x.利润差额);
                decimal 平均利率 = 总报价 > 0 ? (总利润 / 总报价 * 100) : 0;

                ListViewItem sumItem = new ListViewItem("汇总");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add("");
                sumItem.SubItems.Add(总报价.ToString("0.00"));
                sumItem.SubItems.Add(总卖价.ToString("0.00"));
                sumItem.SubItems.Add(总利润.ToString("0.00"));
                sumItem.SubItems.Add(平均利率.ToString("0.00") + "%");
                sumItem.BackColor = System.Drawing.Color.LightYellow;

                列表_查询结果.Items.Add(sumItem);
            }
        }

        private void 按钮_导出_Click(object sender, EventArgs e)
        {
            ExcelControl.ExportExcel.ListViewtoExcel(列表_查询结果);
        }

        private void 列表_部门_ItemCheck(object sender, ItemCheckEventArgs e)
        {
            var count = 列表_部门.CheckedItems.Count;
            var 当前项 = 列表_部门.SelectedIndex;
            var 当前状态 = 列表_部门.GetItemChecked(当前项);
            if (当前状态)
            {
                count -= 1;
            }
            else
            {
                count += 1;
            }
            if (count > 0)
            {
                var tmpstr = "";
                for (int i = 0; i < 列表_部门.Items.Count; i++)
                {
                    var 该项状态 = 列表_部门.GetItemChecked(i);
                    if (i == 当前项) 该项状态 = !该项状态;
                    if (该项状态 == true)
                    {
                        if (tmpstr != "")
                        {
                            tmpstr += ",";
                        }
                        tmpstr += "'" + 列表_部门.GetItemText(列表_部门.Items[i]) + "'";
                    }
                }
                模块_通用函数.易捷业务员表().DefaultView.RowFilter = "TEMNME in (" + tmpstr + ")";
            }
            else
            {
                模块_通用函数.易捷业务员表().DefaultView.RowFilter = "";
            }
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
