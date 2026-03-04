// ============================================================
// 在 窗体_功能列表.cs 中添加以下代码
// ============================================================

// 1. 添加按钮点击事件处理方法
private void btn 报价差额统计_Click(object sender, EventArgs e)
{
    new 窗体_报价差额统计 ().Show();
}

// ============================================================
// 在 窗体_功能列表.Designer.cs 中添加以下代码
// ============================================================

// 2. 在类声明中添加按钮字段（与其他按钮字段放在一起）
private System.Windows.Forms.Button btn 报价差额统计;

// 3. 在 InitializeComponent() 方法中添加按钮初始化代码
// 建议放在 按钮_各部门报表 之后

// 创建按钮
this.btn 报价差额统计 = new System.Windows.Forms.Button();
this.btn 报价差额统计.Location = new System.Drawing.Point(280, 100); // 根据实际布局调整坐标
this.btn 报价差额统计.Name = "btn 报价差额统计";
this.btn 报价差额统计.Size = new System.Drawing.Size(130, 50);
this.btn 报价差额统计.TabIndex = 2; // 根据实际 Tab 顺序调整
this.btn 报价差额统计.Text = "报价差额统计\r\n(报价 vs 卖价)";
this.btn 报价差额统计.UseVisualStyleBackColor = true;
this.btn 报价差额统计.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(255)))), ((int)(((byte)(152)))), ((int)(((byte)(0)))));
this.btn 报价差额统计.ForeColor = System.Drawing.Color.White;
this.btn 报价差额统计.Font = new System.Drawing.Font("宋体", 10F, System.Drawing.FontStyle.Bold);
this.btn 报价差额统计.Click += new System.EventHandler(this.btn 报价差额统计_Click);
this.Controls.Add(this.btn 报价差额统计);

// ============================================================
// 完整示例（参考现有按钮布局）
// ============================================================
/*
private void InitializeComponent()
{
    this.按钮_销售员图 = new System.Windows.Forms.Button();
    this.按钮_各部门报表 = new System.Windows.Forms.Button();
    this.btn 报价差额统计 = new System.Windows.Forms.Button();  // <-- 新增
    this.SuspendLayout();
    
    // 按钮_销售员图
    this.按钮_销售员图.Location = new System.Drawing.Point(20, 20);
    this.按钮_销售员图.Name = "按钮_销售员图";
    this.按钮_销售员图.Size = new System.Drawing.Size(130, 50);
    this.按钮_销售员图.TabIndex = 0;
    this.按钮_销售员图.Text = "销售员图";
    this.按钮_销售员图.UseVisualStyleBackColor = true;
    this.按钮_销售员图.Click += new System.EventHandler(this.按钮_销售员图_Click);
    
    // 按钮_各部门报表
    this.按钮_各部门报表.Location = new System.Drawing.Point(160, 20);
    this.按钮_各部门报表.Name = "按钮_各部门报表";
    this.按钮_各部门报表.Size = new System.Drawing.Size(130, 50);
    this.按钮_各部门报表.TabIndex = 1;
    this.按钮_各部门报表.Text = "各部门报表";
    this.按钮_各部门报表.UseVisualStyleBackColor = true;
    this.按钮_各部门报表.Click += new System.EventHandler(this.按钮_各部门报表_Click);
    
    // btn 报价差额统计 (新增)
    this.btn 报价差额统计.Location = new System.Drawing.Point(300, 20);  // <-- 新增按钮位置
    this.btn 报价差额统计.Name = "btn 报价差额统计";
    this.btn 报价差额统计.Size = new System.Drawing.Size(130, 50);
    this.btn 报价差额统计.TabIndex = 2;
    this.btn 报价差额统计.Text = "报价差额统计";
    this.btn 报价差额统计.UseVisualStyleBackColor = true;
    this.btn 报价差额统计.Click += new System.EventHandler(this.btn 报价差额统计_Click);  // <-- 新增事件
    
    // 窗体_功能列表
    this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
    this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
    this.ClientSize = new System.Drawing.Size(450, 90);
    this.Controls.Add(this.btn 报价差额统计);  // <-- 添加控件
    this.Controls.Add(this.按钮_各部门报表);
    this.Controls.Add(this.按钮_销售员图);
    this.Name = "窗体_功能列表";
    this.Text = "易捷查询工具";
    this.ResumeLayout(false);
}
*/
