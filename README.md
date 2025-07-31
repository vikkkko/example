# example

示例，走通safe sdk

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd example

# 安装依赖
npm install
```

### 2. 环境配置

创建 `.env` 文件并配置以下环境变量：

```env
# Infura配置
INFURA_PROJECT_ID=your_infura_project_id

# 私钥配置
PRIVATE_KEY=your_private_key
PRIVATE_KEY_USER2=your_second_private_key

# Safe API配置 (可选)
SAFE_API_KEY=your_safe_api_key

# Graph API配置
GRAPH_API_KEY=your_graph_api_key
```

### 3. 运行示例

```bash
# 创建多签钱包
npm run dev:create

# 发送ERC20转账
npm run dev:send

# 配置多签钱包
npm run dev:setting

# 查询GraphQL数据
npm run dev:graph
```


```
src/
├── utils/
│   └── SafeUtils.ts          # Safe工具类
├── MultiAddress_Create.ts    # 创建多签钱包
├── MultiAddress_SendTx.ts    # ERC20转账
├── MultiAddress_Setting.ts   # 多签配置
├── MultiAddress_Get.ts       # 数据查询
└── GetDataFromGraph.ts       # GraphQL查询
```

