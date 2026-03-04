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
    public partial class 窗体_报价差额统计 : Form
    {
        private DatabaseInfo _currentDb;
        private List<DatabaseInfo> _databases;
        private List<tempData> _queryResults;

        public 窗体_报价差额统计()
        {
            InitializeComponent();
        }

        private void 窗体_报价差额统计_Load(object sender, EventArgs e)
        {
            _databases = DatabaseInfos.GetDatabaseInfos().Where(db =>
                db.FactoryName != "临海"
            ).ToList();

            cbo服务器.DataSource = _databases;
            cbo服务器.DisplayMember = "FactoryName";
            cbo服务器.SelectedIndex = 0;

            dtp从.Value = DateTime.Today.AddDays(-30);
            dtp到.Value = DateTime.Today;

            LoadFilterData();
        }

        private void LoadFilterData()
        {
            try
            {
                var 部门表 = 模块_通用函数.易捷部门表();
                if (部门表 != null)
                {
                    var 部门列表 = 部门表.AsEnumerable()
                        .Select(r => r.Field<string>("TEMNME"))
                        .Where(d => !string.IsNullOrEmpty(d))
                        .Distinct()
                        .OrderBy(d => d)
                        .ToList();

                    cbo部门.Items.Clear();
                    cbo部门.Items.Add("");
                    cbo部门.Items.AddRange(部门列表.ToArray());
                    cbo部门.SelectedIndex = 0;
                }

                var 业务员表 = 模块_通用函数.易捷业务员表();
                if (业务员表 != null)
                {
                    var 业务员列表 = 业务员表.AsEnumerable()
                        .Select(r => new
                        {
                            代码 = r.Field<string>("EMPCDE"),
                            姓名 = r.Field<string>("EMPNME"),
                            部门 = r.Field<string>("TEMNME")
                        })
                        .Where(s => !string.IsNullOrEmpty(s.代码) && !string.IsNullOrEmpty(s.姓名))
                        .Distinct()
                        .OrderBy(s => s.部门)
                        .ThenBy(s => s.姓名)
                        .ToList();

                    cbo业务员.Items.Clear();
                    cbo业务员.Items.Add("");
                    foreach (var 业务员 in 业务员列表)
                    {
                        cbo业务员.Items.Add(new { 代码 = 业务员.代码, 显示 = $"{业务员.姓名} ({业务员.部门})" });
                    }
                    cbo业务员.SelectedIndex = 0;
                    cbo业务员.DisplayMember = "显示";
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"加载筛选数据失败：{ex.Message}", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btn查询_Click(object sender, EventArgs e)
        {
            try
            {
                btn查询.Enabled = false;
                btn查询.Text = "查询中...";
                Cursor = Cursors.WaitCursor;

                _currentDb = (DatabaseInfo)cbo服务器.SelectedItem;

                string sql = BuildQuerySql();

                _queryResults = new List<tempData>();

                using (var helper = SqlHelperFactory.OpenDatabase(_currentDb.GetConnString(), SqlType.Oracle))
                {
                    var list = helper.Select<tempData>(sql);
                    _queryResults.AddRange(list);
                }

                显示结果(_queryResults);

                lbl统计.Text = $"共查询到 {_queryResults.Count} 条记录 | " +
                    $"报价金额合计：{_queryResults.Sum(q => q.报价金额):F2} | " +
                    $"卖价金额合计：{_queryResults.Sum(q => q.卖价金额):F2} | " +
                    $"差额合计：{_queryResults.Sum(q => q.差额):F2}";
            }
            catch (Exception ex)
            {
                MessageBox.Show($"查询失败：{ex.Message}", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                btn查询.Enabled = true;
                btn查询.Text = "查询";
                Cursor = Cursors.Default;
            }
        }

        private string BuildQuerySql()
        {
            StringBuilder sql = new StringBuilder();

            sql.Append(@"
SELECT 
    b.serial as 单号,
    b.created as 日期,
    b.clntcde as 客户代码,
    c.clntnme as 客户名称,
    ca.agntcde as 业务员代码,
    dm.empnme as 业务员姓名,
    dm.dptnme as 部门名称,
    b.prdcde as 产品代码,
    b.prdnme as 产品名称,
    b.ordnum as 订单数量,
    b.quoprc as 报价单价,
    b.prices as 实际单价,
    b.quoprc * b.ordnum as 报价金额,
    b.accamt as 卖价金额,
    b.accamt - (b.quoprc * b.ordnum) as 差额,
    CASE 
        WHEN b.quoprc * b.ordnum > 0 
        THEN (b.accamt - (b.quoprc * b.ordnum)) / (b.quoprc * b.ordnum) * 100
        ELSE 0 
    END as 差额率
FROM ferp.ord_bas b
LEFT JOIN ferp.pb_clnt c ON b.clntcde = c.clntcde
LEFT JOIN ferp.pb_clnt_agnt ca ON c.clntcde = ca.clntcde AND ca.isactive = 'Y'
LEFT JOIN ferp.pb_dept_member dm ON ca.agntcde = dm.empcde AND dm.isactive = 'Y'
WHERE b.isactive = 'Y' 
  AND b.quoprc IS NOT NULL 
  AND b.quoprc > 0
");

            sql.Append($" AND b.created >= TO_DATE('{dtp从.Value:yyyy-MM-dd 00:00:00}', 'YYYY-MM-DD HH24:MI:SS')");
            sql.Append($" AND b.created < TO_DATE('{dtp到.Value.AddDays(1):yyyy-MM-dd 00:00:00}', 'YYYY-MM-DD HH24:MI:SS')");

            if (cbo业务员.SelectedIndex > 0)
            {
                dynamic selectedAgent = cbo业务员.SelectedItem;
                string agentCode = selectedAgent.代码;
                sql.Append($" AND ca.agntcde = '{agentCode}'");
            }

            if (cbo部门.SelectedIndex > 0)
            {
                string deptName = cbo部门.SelectedItem.ToString();
                sql.Append($" AND dm.dptnme = '{deptName}'");
            }

            if (cbo客户.SelectedIndex > 0)
            {
                string clientCode = cbo客户.SelectedValue?.ToString();
                if (!string.IsNullOrEmpty(clientCode))
                {
                    sql.Append($" AND b.clntcde = '{clientCode}'");
                }
            }

            if (!string.IsNullOrWhiteSpace(txt单号.Text))
            {
                sql.Append($" AND b.serial LIKE '%{txt单号.Text.Trim()}%'");
            }

            if (!string.IsNullOrWhiteSpace(txt产品.Text))
            {
                string productKeyword = txt产品.Text.Trim();
                sql.Append($" AND (b.prdcde LIKE '%{productKeyword}%' OR b.prdnme LIKE '%{productKeyword}%')");
            }

            sql.Append(" ORDER BY b.created DESC");

            return sql.ToString();
        }

        private void 显示结果(List<tempData> results)
        {
            lv查询结果.Items.Clear();

            foreach (var item in results)
            {
                ListViewItem lvi = new ListViewItem();
                lvi.Text = _currentDb.FactoryName;
                lvi.SubItems.Add(item.单号);
                lvi.SubItems.Add(item.客户名称);
                lvi.SubItems.Add(item.业务员姓名 ?? "N/A");
                lvi.SubItems.Add(item.部门名称 ?? "N/A");
                lvi.SubItems.Add(item.产品代码);
                lvi.SubItems.Add(item.产品名称);
                lvi.SubItems.Add(item.订单数量.ToString("N0"));
                lvi.SubItems.Add(item.报价单价.ToString("F4"));
                lvi.SubItems.Add(item.实际单价.ToString("F4"));
                lvi.SubItems.Add(item.报价金额.ToString("F2"));
                lvi.SubItems.Add(item.卖价金额.ToString("F2"));

                if (item.差额 > 0)
                {
                    lvi.SubItems[11].ForeColor = Color.Green;
                }
                else if (item.差额 < 0)
                {
                    lvi.SubItems[11].ForeColor = Color.Red;
                }

                lv查询结果.Items.Add(lvi);
            }
        }

        private void btn导出_Click(object sender, EventArgs e)
        {
            if (_queryResults == null || _queryResults.Count == 0)
            {
                MessageBox.Show("没有数据可导出", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            try
            {
                var assembly = System.Reflection.Assembly.LoadFrom("ExcelControl.dll");
                var type = assembly.GetType("ExcelControl.ExportExcel");
                var method = type.GetMethod("ListViewtoExcel");
                method.Invoke(null, new object[] { lv查询结果 });

                MessageBox.Show("导出成功！", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"导出失败：{ex.Message}", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public class tempData
        {
            public string 单号 { get; set; }
            public DateTime 日期 { get; set; }
            public string 客户代码 { get; set; }
            public string 客户名称 { get; set; }
            public string 业务员代码 { get; set; }
            public string 业务员姓名 { get; set; }
            public string 部门名称 { get; set; }
            public string 产品代码 { get; set; }
            public string 产品名称 { get; set; }
            public int 订单数量 { get; set; }
            public decimal 报价单价 { get; set; }
            public decimal 实际单价 { get; set; }
            public decimal 报价金额 { get; set; }
            public decimal 卖价金额 { get; set; }
            public decimal 差额 { get; set; }
            public decimal 差额率 { get; set; }
        }
    }
}
