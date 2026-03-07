# MCP Oracle Server - Node.js/Python 版本方案

## 问题回顾

您的 `yijie-group` MCP Server 启动失败，错误为 `'docker' 不是内部或外部命令`，因为系统未安装 Docker。

## 解决方案：使用 Node.js 版本

经过搜索，**MCP 官方目前没有提供 Oracle 的 Node.js 版本 Server**。但可以通过以下方式解决：

---

## 方案 A：使用 @f4ww4z/mcp-mysql-server 修改版（推荐尝试）

有一个社区维护的 MySQL MCP Server 使用 Node.js，可以参考其模式为 Oracle 创建或寻找类似的 Oracle 版本。

### 安装步骤：

1. **先安装 Node.js**（如未安装）
   - 下载地址：https://nodejs.org/
   - 安装 LTS 版本

2. **使用 npx 直接运行（无需全局安装）**

---

## 方案 B：使用 Python 版本的 Oracle MCP Server

### 1. 安装依赖

```bash
# 安装 Python 3.8+
# 安装 Oracle 驱动
pip install oracledb

# 安装 MCP SDK
pip install mcp
```

### 2. 创建 Oracle MCP Server 脚本

创建文件 `oracle_mcp_server.py`：

```python
#!/usr/bin/env python3
"""Oracle MCP Server - Python 实现"""
import asyncio
import os
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool
import oracledb

# 从环境变量获取连接信息
ORACLE_CONNECTION_STRING = os.environ.get("ORACLE_CONNECTION_STRING", "")

app = Server("oracle-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="execute_sql",
            description="执行 Oracle SQL 查询",
            inputSchema={
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "要执行的 SQL 语句"
                    }
                },
                "required": ["sql"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "execute_sql":
        sql = arguments.get("sql", "")
        try:
            # 解析连接字符串
            # 格式: user/password@host:port/service_name
            conn_str = ORACLE_CONNECTION_STRING
            
            # 连接 Oracle
            connection = oracledb.connect(conn_str)
            cursor = connection.cursor()
            cursor.execute(sql)
            
            # 获取结果
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            
            # 格式化输出
            result = []
            result.append(" | ".join(columns))
            result.append("-" * 50)
            for row in rows:
                result.append(" | ".join(str(col) for col in row))
            
            cursor.close()
            connection.close()
            
            return [TextContent(type="text", text="\n".join(result))]
        except Exception as e:
            return [TextContent(type="text", text=f"错误: {str(e)}")]
    
    return [TextContent(type="text", text=f"未知工具: {name}")]

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

### 3. JSON 配置写法

```json
{
  "mcpServers": {
    "yijie-group": {
      "command": "python",
      "args": [
        "h:/TraeDev/易捷业务数据查询/oracle_mcp_server.py"
      ],
      "env": {
        "ORACLE_CONNECTION_STRING": "fgrp/kuke.fgrp@36.138.130.91:1521/dbms"
      }
    }
  }
}
```

---

## 方案 C：使用 npx 运行 Node.js Oracle MCP Server（如果有）

如果社区有人发布了 Oracle MCP Server 的 npm 包，配置格式如下：

```json
{
  "mcpServers": {
    "yijie-group": {
      "command": "npx",
      "args": [
        "-y",
        "@someuser/mcp-oracle-server"
      ],
      "env": {
        "ORACLE_CONNECTION_STRING": "fgrp/kuke.fgrp@36.138.130.91:1521/dbms"
      }
    }
  }
}
```

---

## 方案 D：基于 @modelcontextprotocol/server-postgres 修改

MCP 官方提供了 PostgreSQL 的 Node.js 版本，可以参考其源码修改为 Oracle 版本。

### 官方 Postgres Server 配置参考：

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:password@host:port/database"
      ]
    }
  }
}
```

---

## 推荐实施方案

### 最快捷的方案：使用 Python 版本

1. **安装 Python 依赖**：
   ```bash
   pip install mcp oracledb
   ```

2. **创建 Python MCP Server 文件**（保存为 `oracle_mcp_server.py`）

3. **修改 JSON 配置**：
   ```json
   {
     "mcpServers": {
       "yijie-group": {
         "command": "python",
         "args": ["h:/TraeDev/易捷业务数据查询/oracle_mcp_server.py"],
         "env": {
           "ORACLE_CONNECTION_STRING": "fgrp/kuke.fgrp@36.138.130.91:1521/dbms"
         }
       }
     }
   }
   ```

4. **重启 Trae IDE**，启用 MCP Server

---

## 注意事项

1. **Oracle Instant Client**：Python 的 `oracledb` 驱动在 Oracle 12.1+ 版本不需要额外安装客户端，但如果是旧版本可能需要安装 Oracle Instant Client

2. **连接字符串格式**：确保连接字符串格式正确：`用户名/密码@主机:端口/服务名`

3. **Python 路径**：确保 `python` 命令在系统 PATH 中，或使用完整路径如 `C:\Python39\python.exe`

---

## 备选：继续使用 Docker（长期推荐）

如果以上方案配置复杂，建议还是安装 Docker Desktop：
- 下载：https://www.docker.com/products/docker-desktop/
- 安装后无需修改配置即可使用
