namespace 易捷查询CSharp
{
    partial class 窗体_各部门报表
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.按钮_导出 = new System.Windows.Forms.Button();
            this.列表_查询结果 = new System.Windows.Forms.ListView();
            this.ColumnHeader23 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.ColumnHeader24 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.ColumnHeader25 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.ColumnHeader26 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.ColumnHeader27 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.ColumnHeader1 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.ColumnHeader2 = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.按钮_查询 = new System.Windows.Forms.Button();
            this.GroupBox1 = new System.Windows.Forms.GroupBox();
            this.Label6 = new System.Windows.Forms.Label();
            this.Label1 = new System.Windows.Forms.Label();
            this.日期_到 = new System.Windows.Forms.DateTimePicker();
            this.日期_从 = new System.Windows.Forms.DateTimePicker();
            this.GroupBox1.SuspendLayout();
            this.SuspendLayout();
            // 
            // 按钮_导出
            // 
            this.按钮_导出.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.按钮_导出.Location = new System.Drawing.Point(1024, 580);
            this.按钮_导出.Name = "按钮_导出";
            this.按钮_导出.Size = new System.Drawing.Size(75, 23);
            this.按钮_导出.TabIndex = 27;
            this.按钮_导出.Text = "导出Excel";
            this.按钮_导出.UseVisualStyleBackColor = true;
            this.按钮_导出.Click += new System.EventHandler(this.按钮_导出_Click);
            // 
            // 列表_查询结果
            // 
            this.列表_查询结果.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.列表_查询结果.Columns.AddRange(new System.Windows.Forms.ColumnHeader[] {
            this.ColumnHeader23,
            this.ColumnHeader24,
            this.ColumnHeader25,
            this.ColumnHeader26,
            this.ColumnHeader27,
            this.ColumnHeader1,
            this.ColumnHeader2});
            this.列表_查询结果.FullRowSelect = true;
            this.列表_查询结果.GridLines = true;
            this.列表_查询结果.HideSelection = false;
            this.列表_查询结果.Location = new System.Drawing.Point(12, 69);
            this.列表_查询结果.Name = "列表_查询结果";
            this.列表_查询结果.Size = new System.Drawing.Size(1087, 505);
            this.列表_查询结果.TabIndex = 26;
            this.列表_查询结果.UseCompatibleStateImageBehavior = false;
            this.列表_查询结果.View = System.Windows.Forms.View.Details;
            // 
            // ColumnHeader23
            // 
            this.ColumnHeader23.Text = "部门";
            this.ColumnHeader23.Width = 150;
            // 
            // ColumnHeader24
            // 
            this.ColumnHeader24.Text = "类型";
            this.ColumnHeader24.Width = 120;
            // 
            // ColumnHeader25
            // 
            this.ColumnHeader25.Text = "单数";
            this.ColumnHeader25.Width = 100;
            // 
            // ColumnHeader26
            // 
            this.ColumnHeader26.Text = "金额";
            this.ColumnHeader26.Width = 120;
            // 
            // ColumnHeader27
            // 
            this.ColumnHeader27.Text = "面积";
            this.ColumnHeader27.Width = 120;
            // 
            // ColumnHeader1
            // 
            this.ColumnHeader1.Text = "均价（元/平方）";
            this.ColumnHeader1.Width = 120;
            // 
            // ColumnHeader2
            // 
            this.ColumnHeader2.Text = "均量（平方/单）";
            this.ColumnHeader2.Width = 120;
            // 
            // 按钮_查询
            // 
            this.按钮_查询.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.按钮_查询.Location = new System.Drawing.Point(635, 12);
            this.按钮_查询.Name = "按钮_查询";
            this.按钮_查询.Size = new System.Drawing.Size(464, 51);
            this.按钮_查询.TabIndex = 25;
            this.按钮_查询.Text = "查询";
            this.按钮_查询.UseVisualStyleBackColor = true;
            this.按钮_查询.Click += new System.EventHandler(this.按钮_查询_Click);
            // 
            // GroupBox1
            // 
            this.GroupBox1.Controls.Add(this.Label6);
            this.GroupBox1.Controls.Add(this.Label1);
            this.GroupBox1.Controls.Add(this.日期_到);
            this.GroupBox1.Controls.Add(this.日期_从);
            this.GroupBox1.Location = new System.Drawing.Point(12, 12);
            this.GroupBox1.Name = "GroupBox1";
            this.GroupBox1.Size = new System.Drawing.Size(389, 51);
            this.GroupBox1.TabIndex = 24;
            this.GroupBox1.TabStop = false;
            this.GroupBox1.Text = "下单日期";
            // 
            // Label6
            // 
            this.Label6.AutoSize = true;
            this.Label6.Location = new System.Drawing.Point(200, 26);
            this.Label6.Name = "Label6";
            this.Label6.Size = new System.Drawing.Size(53, 12);
            this.Label6.TabIndex = 2;
            this.Label6.Text = "日期到：";
            // 
            // Label1
            // 
            this.Label1.AutoSize = true;
            this.Label1.Location = new System.Drawing.Point(14, 26);
            this.Label1.Name = "Label1";
            this.Label1.Size = new System.Drawing.Size(53, 12);
            this.Label1.TabIndex = 0;
            this.Label1.Text = "日期从：";
            // 
            // 日期_到
            // 
            this.日期_到.Location = new System.Drawing.Point(259, 22);
            this.日期_到.Name = "日期_到";
            this.日期_到.Size = new System.Drawing.Size(121, 21);
            this.日期_到.TabIndex = 3;
            // 
            // 日期_从
            // 
            this.日期_从.Location = new System.Drawing.Point(73, 22);
            this.日期_从.Name = "日期_从";
            this.日期_从.Size = new System.Drawing.Size(121, 21);
            this.日期_从.TabIndex = 1;
            // 
            // 窗体_各部门报表
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1111, 615);
            this.Controls.Add(this.按钮_导出);
            this.Controls.Add(this.列表_查询结果);
            this.Controls.Add(this.按钮_查询);
            this.Controls.Add(this.GroupBox1);
            this.Name = "窗体_各部门报表";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "窗体_各部门报表";
            this.Load += new System.EventHandler(this.窗体_各部门报表_Load);
            this.GroupBox1.ResumeLayout(false);
            this.GroupBox1.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        internal System.Windows.Forms.Button 按钮_导出;
        internal System.Windows.Forms.ListView 列表_查询结果;
        internal System.Windows.Forms.ColumnHeader ColumnHeader23;
        internal System.Windows.Forms.ColumnHeader ColumnHeader24;
        internal System.Windows.Forms.ColumnHeader ColumnHeader25;
        internal System.Windows.Forms.ColumnHeader ColumnHeader26;
        internal System.Windows.Forms.ColumnHeader ColumnHeader27;
        internal System.Windows.Forms.ColumnHeader ColumnHeader1;
        internal System.Windows.Forms.ColumnHeader ColumnHeader2;
        internal System.Windows.Forms.Button 按钮_查询;
        internal System.Windows.Forms.GroupBox GroupBox1;
        internal System.Windows.Forms.Label Label6;
        internal System.Windows.Forms.Label Label1;
        internal System.Windows.Forms.DateTimePicker 日期_到;
        internal System.Windows.Forms.DateTimePicker 日期_从;
    }
}