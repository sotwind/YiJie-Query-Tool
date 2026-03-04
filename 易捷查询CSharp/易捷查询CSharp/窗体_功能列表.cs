using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace 易捷查询CSharp
{
    public partial class 窗体_功能列表 : Form
    {
        public 窗体_功能列表()
        {
            InitializeComponent();
        }

        private void 按钮_销售员图_Click(object sender, EventArgs e)
        {
            new 窗体_销售员图().Show();
        }

        private void 按钮_各部门报表_Click(object sender, EventArgs e)
        {
            new 窗体_各部门报表().Show();
        }

        private void 按钮_报价差额统计_Click(object sender, EventArgs e)
        {
            new 窗体_报价差额统计().Show();
        }

        private void 窗体_功能列表_Load(object sender, EventArgs e)
        {

        }
    }
}
