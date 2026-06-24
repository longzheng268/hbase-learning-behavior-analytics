# 学习行为数据存储与分析系统

基于 **HBase** 的在线学习行为数据存储、查询与分析系统（大数据技术课程设计）。

## 技术栈

| 层次 | 技术 |
|------|------|
| 后端框架 | Spring Boot 2.7 + Java 11 |
| 行为数据存储 | Apache HBase 2.5.x |
| 基础数据存储 | SQLite |
| 前端 | HTML/CSS/JavaScript + ECharts 5 |
| 构建 | Maven 3.8+ |

## 快速启动

### 前置条件
- JDK 11+
- Maven 3.6+
- HBase 2.x（Standalone 或分布式模式）

### 启动步骤

```bash
# 1. 启动 HBase
start-hbase.sh

# 2. 编译打包
mvn clean package -DskipTests

# 3. 启动应用
java -jar target/hbase-learning-analytics-1.0.0.jar

# 4. 打开浏览器 http://localhost:8080
# 5. 点击左侧"初始化演示数据"按钮
```

### HBase Shell 验证

```bash
hbase shell
scan 'learning:learning_behavior', {LIMIT => 5}
count 'learning:learning_behavior'
```

## 功能模块

1. **数据概览** — 仪表盘展示学生/课程/行为统计
2. **行为记录** — 分页展示所有行为，支持类型过滤
3. **多维查询** — 按学生、课程、行为类型、时间范围组合查询
4. **学生概况** — 个人学习统计与趋势图表
5. **统计分析** — 10项统计指标 + 可视化图表
6. **数据管理** — 新增/更新/删除行为记录

## HBase 表设计

| 项目 | 设计 |
|------|------|
| 命名空间 | `learning` |
| 表名 | `learning:learning_behavior` |
| 列族1 | `info`（student_id, course_id, behavior_type, timestamp）|
| 列族2 | `detail`（resource_id, device, ip_address, score, duration, status, extra_info）|
| RowKey | `{studentId}_{reverseTimestamp}_{behaviorType}_{randomSuffix}` |

## 项目结构

```
src/main/java/com/learning/
├── config/          # HBase + SQLite 配置
├── model/           # 数据模型（Student, Course, LearningBehavior...）
├── dao/             # 数据访问层（HBaseDao, SQLiteDao）
├── service/         # 业务逻辑 + 统计分析
├── controller/      # REST API 接口
└── util/            # 模拟数据生成器
src/main/resources/static/
├── index.html       # 主页面
├── css/style.css    # 样式
└── js/app.js        # 前端逻辑
docs/
└── 课程设计报告.md   # 完整课程设计报告
```
