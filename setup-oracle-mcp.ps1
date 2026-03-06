# Oracle MCP Server 安装脚本
# 本脚本帮助配置 Oracle SQLcl 和 Trae AI MCP

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Oracle MCP Server 配置脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 配置路径
$ProjectDir = "H:\TraeDev\易捷业务数据查询"
$SqlclDir = "$ProjectDir\sqlcl"
$SqlclBin = "$SqlclDir\bin"
$TraeConfigDir = "C:\Users\Administrator\.trae-cn"
$McpConfigFile = "$TraeConfigDir\mcp.json"

# 检查 SQLcl 是否已安装
Write-Host "检查 SQLcl 安装状态..." -ForegroundColor Yellow
if (Test-Path "$SqlclBin\sql.exe") {
    Write-Host "✓ SQLcl 已安装在: $SqlclDir" -ForegroundColor Green
} else {
    Write-Host "✗ SQLcl 未找到" -ForegroundColor Red
    Write-Host ""
    Write-Host "请按以下步骤操作:" -ForegroundColor Cyan
    Write-Host "1. 访问 https://www.oracle.com/database/sqldeveloper/technologies/sqlcl/download/" -ForegroundColor White
    Write-Host "2. 登录 Oracle 账号（如没有请注册）" -ForegroundColor White
    Write-Host "3. 下载 Windows 版本的 SQLcl" -ForegroundColor White
    Write-Host "4. 将 zip 文件解压到: $SqlclDir" -ForegroundColor White
    Write-Host ""
    Write-Host "解压后目录结构应该是:" -ForegroundColor Gray
    Write-Host "  sqlcl/" -ForegroundColor Gray
    Write-Host "  ├── bin/" -ForegroundColor Gray
    Write-Host "  │   ├── sql.exe" -ForegroundColor Gray
    Write-Host "  │   └── ..." -ForegroundColor Gray
    Write-Host "  └── lib/" -ForegroundColor Gray
    Write-Host ""
    Read-Host "按回车键退出..."
    exit 1
}

# 测试 SQLcl 版本
Write-Host ""
Write-Host "测试 SQLcl 版本..." -ForegroundColor Yellow
try {
    $version = & "$SqlclBin\sql.exe" -V 2>&1
    Write-Host "✓ SQLcl 版本: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ 无法获取 SQLcl 版本，请检查 JDK 是否安装" -ForegroundColor Red
    Write-Host "  SQLcl 需要 JDK 8 或更高版本" -ForegroundColor Yellow
}

# 显示数据库连接信息
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "配置的数据库连接 (使用 Thin 模式)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$dbConnections = @(
    @{Name="老厂新系统"; Server="oracle-yijie-laocang"; Host="36.138.132.30"; User="read"},
    @{Name="新厂新系统"; Server="oracle-yijie-xinchang"; Host="36.134.7.141"; User="ferp"},
    @{Name="温森新系统"; Server="oracle-yijie-wensen"; Host="db.05.forestpacking.com"; User="read"},
    @{Name="临海老系统"; Server="oracle-yijie-linhai"; Host="36.137.213.189"; User="read"},
    @{Name="易捷集团"; Server="oracle-yijie-jituan"; Host="36.138.130.91"; User="fgrp"}
)

foreach ($db in $dbConnections) {
    Write-Host "[$($db.Name)]" -ForegroundColor Green
    Write-Host "  MCP Server: $($db.Server)" -ForegroundColor White
    Write-Host "  Host: $($db.Host):1521/dbms" -ForegroundColor White
    Write-Host "  User: $($db.User)" -ForegroundColor White
    Write-Host ""
}

# 测试连接（可选）
Write-Host ""
$testConnection = Read-Host "是否测试数据库连接? (y/n)"
if ($testConnection -eq 'y' -or $testConnection -eq 'Y') {
    Write-Host ""
    Write-Host "测试数据库连接..." -ForegroundColor Yellow
    
    # 测试老厂连接（使用 Thin 模式）
    Write-Host "测试 老厂新系统 (36.138.132.30)..." -ForegroundColor Cyan
    try {
        $output = & "$SqlclBin\sql.exe" -thin read/ejsh.read@36.138.132.30:1521/dbms -e "SELECT 1 FROM DUAL;" 2>&1
        if ($output -match "已连接" -or $output -match "Connected") {
            Write-Host "  ✓ 连接成功" -ForegroundColor Green
        } else {
            Write-Host "  ✗ 连接失败" -ForegroundColor Red
            Write-Host "  错误信息: $output" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ✗ 连接失败: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "配置完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "重要提示:" -ForegroundColor Yellow
Write-Host "由于权限限制，请手动复制 MCP 配置文件:" -ForegroundColor White
Write-Host ""
Write-Host "  源文件: $ProjectDir\mcp.json" -ForegroundColor Cyan
Write-Host "  目标:   $McpConfigFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "操作步骤:" -ForegroundColor Yellow
Write-Host "1. 手动复制上述文件到目标位置" -ForegroundColor White
Write-Host "2. 完全关闭 Trae AI" -ForegroundColor White
Write-Host "3. 重新启动 Trae AI" -ForegroundColor White
Write-Host "4. 在对话中测试 Oracle MCP 功能" -ForegroundColor White
Write-Host ""
Write-Host "示例查询:" -ForegroundColor Gray
Write-Host "  - '显示 pb_dept 表的结构'" -ForegroundColor Gray
Write-Host "  - '查询今天的订单数量'" -ForegroundColor Gray
Write-Host "  - '统计本月销售额'" -ForegroundColor Gray
Write-Host ""
Read-Host "按回车键退出..."
