# 修改 ServerType 分类计划

## 目标

将 ServerType 分为三类，分别使用不同的查询方式：

1. **新厂**（新厂新系统）：使用新的基础表查询方式（ORD_CT + ORD_BAS + PB_CLNT）
2. **老厂和温森**（新系统）：使用 V_ORD 视图查询方式
3. **临海**（旧系统）：使用原来的旧系统查询方式（V_ORD + ORD_CT）

## 数据库配置

根据 DatabaseInfos.cs：
- **新厂新系统**：FactoryName = "新厂新系统", ServerType = "新系统"
- **老厂新系统**：FactoryName = "老厂新系统", ServerType = "新系统"
- **温森新系统**：FactoryName = "温森新系统", ServerType = "新系统"
- **临海**：FactoryName = "临海", ServerType = "老系统"

## 修改方案

修改 `BuildQueryString` 方法，同时接收 `serverType` 和 `factoryName` 参数：

```csharp
private string BuildQueryString(string serverType, string factoryName)
{
    string sql;
    
    // 新厂：使用新的基础表查询方式
    if (factoryName == "新厂新系统")
    {
        // 使用 ORD_CT + ORD_BAS + PB_CLNT 查询
    }
    // 老厂和温森：使用 V_ORD 视图查询方式
    else if (factoryName == "老厂新系统" || factoryName == "温森新系统")
    {
        // 使用 V_ORD 视图查询
    }
    // 临海（旧系统）：使用原来的旧系统查询方式
    else
    {
        // 使用 V_ORD + ORD_CT 查询
    }
}
```

## 实施步骤

1. 修改 `BuildQueryString` 方法签名，添加 `factoryName` 参数
2. 修改调用处，传入 `factoryName`
3. 根据 `factoryName` 区分三种查询方式
4. 测试验证三个厂都能正常查询

## 代码修改位置

文件：`h:\TraeDev\易捷业务数据查询\易捷查询CSharp\易捷查询CSharp\窗体_利润统计.cs`

修改点：
1. `BuildQueryString` 方法定义
2. `BuildQueryString` 方法调用处
3. `BuildQueryString` 方法内部逻辑
