# MCP Server (yijie-group) 启动失败解决方案

## 问题分析

错误信息：`'docker' 不是内部或外部命令，也不是可运行的程序或批处理文件。`

**根本原因**：系统未安装 Docker，而 `yijie-group` MCP Server 配置依赖于 Docker 运行 Oracle MCP Server 镜像。

## 解决方案

### 方案一：安装 Docker Desktop（推荐）

**步骤：**

1. **下载 Docker Desktop**

   * 访问 <https://www.docker.com/products/docker-desktop/>

   * 下载 Windows 版本

2. **安装 Docker Desktop**

   * 运行安装程序

   * 根据向导完成安装

   * 重启计算机

3. **验证安装**

   * 打开 PowerShell 或 CMD

   * 运行 `docker --version` 确认安装成功

4. **重新启动 MCP Server**

   * 在 Trae IDE 中重新启用 `yijie-group` MCP Server

***

### 方案二：使用现有的 mcp\_mssql 替代（如果适用）

如果 `yijie-group` 是用于查询 Oracle 数据库，而您已经有 `mcp_mssql`（用于 SQL Server），则需要根据实际需求选择：

* **如果是查询 Oracle 数据库**：必须安装 Docker

* **如果是查询 SQL Server**：可以使用已有的 `mcp_mssql`

***

### 方案三：使用 Node.js 版本的 Oracle MCP Server（无需 Docker）

如果不想安装 Docker，可以寻找或配置 Node.js/Python 版本的 Oracle MCP Server。

需要修改配置，将 `command` 从 `docker` 改为 `node` 或 `npx`，并安装相应的 npm 包。

***

## 建议

推荐采用**方案一：安装 Docker Desktop**，因为：

1. 您当前的配置已经基于 Docker 镜像 `dmeppiel/oracle-mcp-server`
2. Docker 是标准化的容器运行环境，配置简单可靠
3. 安装一次后，可以运行多个基于 Docker 的 MCP Server

## 安装后检查清单

* [ ] Docker Desktop 安装完成

* [ ] 运行 `docker --version` 显示版本号

* [ ] Trae IDE 中 `yijie-group` MCP Server 状态变为绿色

* [ ] 测试连接 Oracle 数据库成功

