namespace 易捷查询CSharp
{
    partial class 窗体_报价差额统计
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.btn查询 = new System.Windows.Forms.Button();
            this.cbo部门 = new System.Windows.Forms.ComboBox();
            this.lbl部门 = new System.Windows.Forms.Label();
            this.cbo业务员 = new System.Windows.Forms.ComboBox();
            this.lbl业务员 = new System.Windows.Forms.Label();
            this.txt产品 = new System.Windows.Forms.TextBox();
            this.lbl产品 = new System.Windows.Forms.Label();
            this.txt单号 = new System.Windows.Forms.TextBox();
            this.lbl单号 = new System.Windows.Forms.Label();
            this.cbo服务器 = new System.Windows.Forms.ComboBox();
            this.lbl服务器 = new System.Windows.Forms.Label();
            this.cbo客户 = new System.Windows.Forms.ComboBox();
            this.lbl客户 = new System.Windows.Forms.Label();
            this.lbl到 = new System.Windows.Forms.Label();
            this.dtp到 = new System.Windows.Forms.DateTimePicker();
            this.dtp从 = new System.Windows.Forms.DateTimePicker();
            this.lbl日期 = new System.Windows.Forms.Label();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.lv查询结果 = new System.Windows.Forms.ListView();
            this.columnHeader1 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader2 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader3 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader4 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader5 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader6 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader7 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader8 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader9 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader10 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader11 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.columnHeader12 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.btn导出 = new System.Windows.Forms.Button();
            this.lbl统计 = new System.Windows.Forms.Label();
            this.groupBox1.SuspendLayout();
            this.groupBox2.SuspendLayout();
            this.SuspendLayout();
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.btn查询);
            this.groupBox1.Controls.Add(this.cbo部门);
            this.groupBox1.Controls.Add(this.lbl部门);
            this.groupBox1.Controls.Add(this.cbo业务员);
            this.groupBox1.Controls.Add(this.lbl业务员);
            this.groupBox1.Controls.Add(this.txt产品);
            this.groupBox1.Controls.Add(this.lbl产品);
            this.groupBox1.Controls.Add(this.txt单号);
            this.groupBox1.Controls.Add(this.lbl单号);
            this.groupBox1.Controls.Add(this.cbo服务器);
            this.groupBox1.Controls.Add(this.lbl服务器);
            this.groupBox1.Controls.Add(this.cbo客户);
            this.groupBox1.Controls.Add(this.lbl客户);
            this.groupBox1.Controls.Add(this.lbl到);
            this.groupBox1.Controls.Add(this.dtp到);
            this.groupBox1.Controls.Add(this.dtp从);
            this.groupBox1.Controls.Add(this.lbl日期);
            this.groupBox1.Dock = System.Windows.Forms.DockStyle.Top;
            this.groupBox1.Location = new System.Drawing.Point(0, 0);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(1284, 106);
            this.groupBox1.TabIndex = 0;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "筛选条件";
            // 
            // btn查询
            // 
            this.btn查询.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(122)))), ((int)(((byte)(204)))));
            this.btn查询.ForeColor = System.Drawing.Color.White;
            this.btn查询.Location = new System.Drawing.Point(1185, 68);
            this.btn查询.Name = "btn查询";
            this.btn查询.Size = new System.Drawing.Size(90, 30);
            this.btn查询.TabIndex = 16;
            this.btn查询.Text = "查询";
            this.btn查询.UseVisualStyleBackColor = false;
            this.btn查询.Click += new System.EventHandler(this.btn查询_Click);
            // 
            // cbo部门
            // 
            this.cbo部门.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbo部门.FormattingEnabled = true;
            this.cbo部门.Location = new System.Drawing.Point(739, 71);
            this.cbo部门.Name = "cbo部门";
            this.cbo部门.Size = new System.Drawing.Size(150, 20);
            this.cbo部门.TabIndex = 15;
            // 
            // lbl部门
            // 
            this.lbl部门.AutoSize = true;
            this.lbl部门.Location = new System.Drawing.Point(691, 74);
            this.lbl部门.Name = "lbl部门";
            this.lbl部门.Size = new System.Drawing.Size(41, 12);
            this.lbl部门.TabIndex = 14;
            this.lbl部门.Text = "部门：";
            // 
            // cbo业务员
            // 
            this.cbo业务员.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbo业务员.FormattingEnabled = true;
            this.cbo业务员.Location = new System.Drawing.Point(535, 71);
            this.cbo业务员.Name = "cbo业务员";
            this.cbo业务员.Size = new System.Drawing.Size(150, 20);
            this.cbo业务员.TabIndex = 13;
            // 
            // lbl业务员
            // 
            this.lbl业务员.AutoSize = true;
            this.lbl业务员.Location = new System.Drawing.Point(475, 74);
            this.lbl业务员.Name = "lbl业务员";
            this.lbl业务员.Size = new System.Drawing.Size(53, 12);
            this.lbl业务员.TabIndex = 12;
            this.lbl业务员.Text = "业务员：";
            // 
            // txt产品
            // 
            this.txt产品.Location = new System.Drawing.Point(939, 71);
            this.txt产品.Name = "txt产品";
            this.txt产品.Size = new System.Drawing.Size(150, 21);
            this.txt产品.TabIndex = 11;
            // 
            // lbl产品
            // 
            this.lbl产品.AutoSize = true;
            this.lbl产品.Location = new System.Drawing.Point(895, 74);
            this.lbl产品.Name = "lbl产品";
            this.lbl产品.Size = new System.Drawing.Size(41, 12);
            this.lbl产品.TabIndex = 10;
            this.lbl产品.Text = "产品：";
            // 
            // txt单号
            // 
            this.txt单号.Location = new System.Drawing.Point(739, 35);
            this.txt单号.Name = "txt单号";
            this.txt单号.Size = new System.Drawing.Size(150, 21);
            this.txt单号.TabIndex = 9;
            // 
            // lbl单号
            // 
            this.lbl单号.AutoSize = true;
            this.lbl单号.Location = new System.Drawing.Point(691, 38);
            this.lbl单号.Name = "lbl单号";
            this.lbl单号.Size = new System.Drawing.Size(41, 12);
            this.lbl单号.TabIndex = 8;
            this.lbl单号.Text = "单号：";
            // 
            // cbo服务器
            // 
            this.cbo服务器.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbo服务器.FormattingEnabled = true;
            this.cbo服务器.Location = new System.Drawing.Point(65, 35);
            this.cbo服务器.Name = "cbo服务器";
            this.cbo服务器.Size = new System.Drawing.Size(150, 20);
            this.cbo服务器.TabIndex = 7;
            // 
            // lbl服务器
            // 
            this.lbl服务器.AutoSize = true;
            this.lbl服务器.Location = new System.Drawing.Point(7, 38);
            this.lbl服务器.Name = "lbl服务器";
            this.lbl服务器.Size = new System.Drawing.Size(53, 12);
            this.lbl服务器.TabIndex = 6;
            this.lbl服务器.Text = "服务器：";
            // 
            // cbo客户
            // 
            this.cbo客户.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbo客户.FormattingEnabled = true;
            this.cbo客户.Location = new System.Drawing.Point(535, 35);
            this.cbo客户.Name = "cbo客户";
            this.cbo客户.Size = new System.Drawing.Size(150, 20);
            this.cbo客户.TabIndex = 5;
            // 
            // lbl客户
            // 
            this.lbl客户.AutoSize = true;
            this.lbl客户.Location = new System.Drawing.Point(487, 38);
            this.lbl客户.Name = "lbl客户";
            this.lbl客户.Size = new System.Drawing.Size(41, 12);
            this.lbl客户.TabIndex = 4;
            this.lbl客户.Text = "客户：";
            // 
            // lbl到
            // 
            this.lbl到.AutoSize = true;
            this.lbl到.Location = new System.Drawing.Point(375, 38);
            this.lbl到.Name = "lbl到";
            this.lbl到.Size = new System.Drawing.Size(17, 12);
            this.lbl到.TabIndex = 3;
            this.lbl到.Text = "到";
            // 
            // dtp到
            // 
            this.dtp到.Location = new System.Drawing.Point(398, 35);
            this.dtp到.Name = "dtp到";
            this.dtp到.Size = new System.Drawing.Size(70, 21);
            this.dtp到.TabIndex = 2;
            // 
            // dtp从
            // 
            this.dtp从.Location = new System.Drawing.Point(300, 35);
            this.dtp从.Name = "dtp从";
            this.dtp从.Size = new System.Drawing.Size(70, 21);
            this.dtp从.TabIndex = 1;
            // 
            // lbl日期
            // 
            this.lbl日期.AutoSize = true;
            this.lbl日期.Location = new System.Drawing.Point(245, 38);
            this.lbl日期.Name = "lbl日期";
            this.lbl日期.Size = new System.Drawing.Size(53, 12);
            this.lbl日期.TabIndex = 0;
            this.lbl日期.Text = "日期：";
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.lv查询结果);
            this.groupBox2.Controls.Add(this.btn导出);
            this.groupBox2.Controls.Add(this.lbl统计);
            this.groupBox2.Dock = System.Windows.Forms.DockStyle.Fill;
            this.groupBox2.Location = new System.Drawing.Point(0, 106);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(1284, 505);
            this.groupBox2.TabIndex = 1;
            this.groupBox2.TabStop = false;
            this.groupBox2.Text = "查询结果";
            // 
            // lv查询结果
            // 
            this.lv查询结果.Columns.AddRange(new System.Windows.Forms.ColumnHeader[] {
            this.columnHeader1,
            this.columnHeader2,
            this.columnHeader3,
            this.columnHeader4,
            this.columnHeader5,
            this.columnHeader6,
            this.columnHeader7,
            this.columnHeader8,
            this.columnHeader9,
            this.columnHeader10,
            this.columnHeader11,
            this.columnHeader12});
            this.lv查询结果.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lv查询结果.FullRowSelect = true;
            this.lv查询结果.GridLines = true;
            this.lv查询结果.Location = new System.Drawing.Point(3, 17);
            this.lv查询结果.Name = "lv查询结果";
            this.lv查询结果.Size = new System.Drawing.Size(1278, 453);
            this.lv查询结果.TabIndex = 2;
            this.lv查询结果.UseCompatibleStateImageBehavior = false;
            this.lv查询结果.View = System.Windows.Forms.View.Details;
            // 
            // columnHeader1
            // 
            this.columnHeader1.Text = "服务器";
            this.columnHeader1.Width = 100;
            // 
            // columnHeader2
            // 
            this.columnHeader2.Text = "单号";
            this.columnHeader2.Width = 120;
            // 
            // columnHeader3
            // 
            this.columnHeader3.Text = "客户";
            this.columnHeader3.Width = 150;
            // 
            // columnHeader4
            // 
            this.columnHeader4.Text = "业务员";
            this.columnHeader4.Width = 100;
            // 
            // columnHeader5
            // 
            this.columnHeader5.Text = "部门";
            this.columnHeader5.Width = 120;
            // 
            // columnHeader6
            // 
            this.columnHeader6.Text = "产品代码";
            this.columnHeader6.Width = 100;
            // 
            // columnHeader7
            // 
            this.columnHeader7.Text = "产品名称";
            this.columnHeader7.Width = 150;
            // 
            // columnHeader8
            // 
            this.columnHeader8.Text = "订单数量";
            this.columnHeader8.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader8.Width = 80;
            // 
            // columnHeader9
            // 
            this.columnHeader9.Text = "报价单价";
            this.columnHeader9.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader9.Width = 80;
            // 
            // columnHeader10
            // 
            this.columnHeader10.Text = "实际单价";
            this.columnHeader10.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader10.Width = 80;
            // 
            // columnHeader11
            // 
            this.columnHeader11.Text = "报价金额";
            this.columnHeader11.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader11.Width = 90;
            // 
            // columnHeader12
            // 
            this.columnHeader12.Text = "卖价金额";
            this.columnHeader12.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            this.columnHeader12.Width = 90;
            // 
            // btn导出
            // 
            this.btn导出.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.btn导出.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(76)))), ((int)(((byte)(175)))), ((int)(((byte)(80)))));
            this.btn导出.ForeColor = System.Drawing.Color.White;
            this.btn导出.Location = new System.Drawing.Point(1089, 476);
            this.btn导出.Name = "btn导出";
            this.btn导出.Size = new System.Drawing.Size(90, 30);
            this.btn导出.TabIndex = 1;
            this.btn导出.Text = "导出 Excel";
            this.btn导出.UseVisualStyleBackColor = false;
            this.btn导出.Click += new System.EventHandler(this.btn导出_Click);
            // 
            // lbl统计
            // 
            this.lbl统计.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left)));
            this.lbl统计.AutoSize = true;
            this.lbl统计.Font = new System.Drawing.Font("宋体", 10F, System.Drawing.FontStyle.Bold);
            this.lbl统计.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(33)))), ((int)(((byte)(150)))), ((int)(((byte)(243)))));
            this.lbl统计.Location = new System.Drawing.Point(6, 481);
            this.lbl统计.Name = "lbl统计";
            this.lbl统计.Size = new System.Drawing.Size(0, 14);
            this.lbl统计.TabIndex = 0;
            // 
            // 窗体_报价差额统计
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1284, 611);
            this.Controls.Add(this.groupBox2);
            this.Controls.Add(this.groupBox1);
            this.Name = "窗体_报价差额统计";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "报价与卖价差额统计";
            this.Load += new System.EventHandler(this.窗体_报价差额统计_Load);
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Label lbl日期;
        private System.Windows.Forms.DateTimePicker dtp从;
        private System.Windows.Forms.DateTimePicker dtp到;
        private System.Windows.Forms.Label lbl到;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.ComboBox cbo服务器;
        private System.Windows.Forms.Label lbl服务器;
        private System.Windows.Forms.ComboBox cbo客户;
        private System.Windows.Forms.Label lbl客户;
        private System.Windows.Forms.TextBox txt单号;
        private System.Windows.Forms.Label lbl单号;
        private System.Windows.Forms.TextBox txt产品;
        private System.Windows.Forms.Label lbl产品;
        private System.Windows.Forms.ComboBox cbo部门;
        private System.Windows.Forms.Label lbl部门;
        private System.Windows.Forms.ComboBox cbo业务员;
        private System.Windows.Forms.Label lbl业务员;
        private System.Windows.Forms.Button btn查询;
        private System.Windows.Forms.ListView lv查询结果;
        private System.Windows.Forms.ColumnHeader columnHeader1;
        private System.Windows.Forms.ColumnHeader columnHeader2;
        private System.Windows.Forms.ColumnHeader columnHeader3;
        private System.Windows.Forms.ColumnHeader columnHeader4;
        private System.Windows.Forms.ColumnHeader columnHeader5;
        private System.Windows.Forms.ColumnHeader columnHeader6;
        private System.Windows.Forms.ColumnHeader columnHeader7;
        private System.Windows.Forms.ColumnHeader columnHeader8;
        private System.Windows.Forms.ColumnHeader columnHeader9;
        private System.Windows.Forms.ColumnHeader columnHeader10;
        private System.Windows.Forms.ColumnHeader columnHeader11;
        private System.Windows.Forms.ColumnHeader columnHeader12;
        private System.Windows.Forms.Button btn导出;
        private System.Windows.Forms.Label lbl统计;
    }
}
