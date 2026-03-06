# Oracle MCP Server 配置指南

## 概述

本指南帮助你在 Trae AI 中配置 Oracle MCP Server，以便通过自然语言查询易捷的 5 个 Oracle 数据库。

## 数据库连接信息

| 名称 | Host | 端口 | 服务名 | 用户名 | 密码 |
|------|------|------|--------|--------|------|
| 易捷集团 | 36.138.130.91 | 1521 | dbms | fgrp | kuke.fgrp |
| 新厂新系统 | 36.134.7.141 | 1521 | dbms | ferp | b0003 |
| 老厂新系统 | 36.138.132.30 | 1521 | dbms | read | ejsh.read |
| 温森新系统 | db.05.forestpacking.com | 1521 | dbms | read | ejsh.read |
| 临海老系统 | 36.137.213.189 | 1521 | dbms | read | ejsh.read |

## 安装步骤

### 1. 下载 Oracle SQLcl

访问 Oracle 官方下载页面：
https://www.oracle.com/database/sqldeveloper/technologies/sqlcl/download/

下载 Windows 版本的 SQLcl（需要 Oracle 账号登录）

### 2. 解压 SQLcl

将下载的 zip 文件解压到项目目录：
```
H:\TraeDev\易捷业务数据查询\sqlcl\
```

解压后目录结构应该是：
```
sqlcl/
├── bin/
│   ├── sql.exe          # Windows 可执行文件
│   └── sql              # Linux/Mac 脚本
└── lib/
    └── ...
```

### 3. 配置环境变量（可选）

将 SQLcl 的 bin 目录添加到系统 PATH：
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";H:\TraeDev\易捷业务数据查询\sqlcl\bin", "User")
```

### 4. 测试 SQLcl 连接

打开命令行，测试连接：
```bash
# 测试易捷集团连接
H:\TraeDev\易捷业务数据查询\sqlcl\bin\sql.exe read/ejsh.read@36.138.132.30:1521/dbms

# 如果连接成功，会显示 SQL> 提示符
# 输入 exit 退出
```

### 5. 配置 Trae AI MCP

创建或编辑 Trae 的 MCP 配置文件：
`C:\Users\Administrator\.trae-cn\mcp.json`

```json
{
  "mcpServers": {
    "oracle-yijie": {
      "type": "stdio",
      "command": "H:\\TraeDev\\易捷业务数据查询\\sqlcl\\bin\\sql.exe",
      "args": [
        "-mcp",
        "read/ejsh.read@36.138.132.30:1521/dbms"
      ],
      "env": {}
    }
  }
}
```

### 6. 重启 Trae AI

配置完成后，完全关闭并重新启动 Trae AI，MCP 服务会自动加载。

## 使用说明

配置完成后，你可以在 Trae AI 中：

1. **查询数据库结构**
   - "显示 pb_dept 表的结构"
   - "列出所有表"

2. **执行 SQL 查询**
   - "查询今天的订单数据"
   - "统计本月销售额"

3. **跨数据库查询**
   - "比较各厂的销售数据"
   - "汇总所有工厂的利润"

## 注意事项

1. **安全性**: MCP Server 会以明文方式传输连接信息，请确保在安全的环境中使用
2. **权限**: 使用的数据库账号应该是只读权限，避免意外修改数据
3. **网络**: 确保 Trae AI 能够访问 Oracle 数据库服务器
4. **防火墙**: 如果连接失败，检查防火墙是否允许 1521 端口通信

## 故障排除

### 连接失败
- 检查网络连接
- 验证用户名密码
- 确认 Oracle 服务正在运行

### SQLcl 无法启动
- 检查 JDK 是否安装（需要 JDK 8 或更高版本）
- 检查 sqlcl\bin\sql.exe 是否存在

### MCP 服务无法加载
- 检查 mcp.json 文件格式是否正确
- 查看 Trae AI 的日志获取详细错误信息
