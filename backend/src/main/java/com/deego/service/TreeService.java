package com.deego.service;

import com.deego.config.*;
import com.deego.enums.TreePathType;
import com.deego.model.TreeNode;
import com.deego.utils.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 树结构服务：基于 YAML 配置动态构建树节点，支持懒加载和聚合组。
 * 使用 BeanUtils 处理 Bean-to-Map 转换。
 */
@Service
public class TreeService {

	@Autowired
	private ConnectionService connectionService;

	@Autowired
	private TreeConfigLoader configLoader;

	@Autowired
	private BeanUtils beanUtils;

	/**
	 * /api/config/tree: 返回根树数据（文件夹 + 连接）。
	 * 返回 List<Map<String, Object>>，使用 BeanUtils 转换。
	 */
	public List<Map<String, Object>> getTreeData() {
		List<TreeNode> rootNodes = new ArrayList<>();

		// 示例：根文件夹（暂静态，实际可从 DB 加载）
		TreeNode rootFolder = createFolder("根", null);
		rootNodes.add(rootFolder);

		// 添加根级连接（parentId 为 null）
		List<com.deego.model.Connection> conns = connectionService.getAllConnections().stream()
																  .filter(c -> c.getParentId() == null)
																  .collect(Collectors.toList());
		for (com.deego.model.Connection conn : conns) {
			TreeNode connNode = toTreeNode(conn);
			// 为连接加载 extraLevels（使用 TreeNode 列表设置 children）
			List<TreeNode> extraTreeNodes = loadExtraLevelsAsTreeNodes(conn.getId());
			connNode.setChildren(extraTreeNodes);
			rootNodes.add(connNode);
		}

		// 使用 BeanUtils 批量转换 Bean -> Map
		return rootNodes.stream()
						.map(beanUtils::beanToMap)
						.collect(Collectors.toList());
	}

	/**
	 * /api/meta/{connId}/{path}/children: 动态加载子节点。
	 * path 示例: "database/mydb"（数据库层）、"database/mydb/schema/public"（schema 层）。
	 * 返回 List<Map<String, Object>>。
	 */
	public List<Map<String, Object>> loadChildren(String connIdStr, String path) {
		Long connId = Long.parseLong(connIdStr);
		JdbcTemplate jdbc = connectionService.getJdbcTemplate(connId);
		DbConfig dbConfig = configLoader.getDbConfig(getDbType(connId));

		List<TreeNode> children = new ArrayList<>();

		// 解析 path segments（用于匹配当前层级和占位符）
		String[] segments = path.split("/");
		Level currentLevel = findCurrentLevel(dbConfig.getLevels(), segments);

		try {
			if (currentLevel.getGroupBy() != null && !currentLevel.getGroupBy().isEmpty()) {
				// 聚合层：创建虚拟 group 节点（如 tables, views）
				for (Map.Entry<String, GroupByConfig> entry : currentLevel.getGroupBy().entrySet()) {
					String groupKey = entry.getKey();
					GroupByConfig group = entry.getValue();
					TreeNode groupNode = createVirtualGroupNode(groupKey, group, path, jdbc, connId);
					children.add(groupNode);
				}
			} else {
				// 普通层：执行 SQL 查询
				String sql = replacePlaceholders(currentLevel.getSqlQuery(), path, segments);
				List<Map<String, Object>> rows = jdbc.queryForList(sql);
				for (Map<String, Object> row : rows) {
					TreeNode node = createLeafNode(row, currentLevel, path, connId);
					children.add(node);
				}
			}

			// **修复：使用枚举替换魔法字符串**
			TreePathType pathType = TreePathType.fromPath(path);
			if (pathType == TreePathType.CONNECTION) {
				List<TreeNode> extras = loadExtraLevelsAsTreeNodes(connId);
				children.addAll(extras);
			}

			// 使用 BeanUtils 批量转换 Bean -> Map
			return children.stream()
						   .map(beanUtils::beanToMap)
						   .collect(Collectors.toList());

		} catch (Exception e) {
			// 日志记录，生产加 Sentry 等
			System.err.println("Load children failed for path: " + path + ", error: " + e.getMessage());
			return Collections.emptyList();
		}
	}

	/**
	 * 加载 extraLevels（如 publications, roles），返回 TreeNode 列表（内部使用）。
	 */
	private List<TreeNode> loadExtraLevelsAsTreeNodes(Long connId) {
		List<TreeNode> extras = new ArrayList<>();
		DbConfig dbConfig = configLoader.getDbConfig(getDbType(connId));
		JdbcTemplate jdbc = connectionService.getJdbcTemplate(connId);

		if (dbConfig.getExtraLevels() != null) {
			for (ExtraLevel extra : dbConfig.getExtraLevels()) {
				if ("connection".equals(extra.getPosition())) {  // **未来可替换为枚举匹配**
					try {
						String sql = replacePlaceholders(extra.getSqlQuery(), "", new String[0]);
						List<Map<String, Object>> rows = jdbc.queryForList(sql);
						for (Map<String, Object> row : rows) {
							TreeNode node = createLeafNode(row, extra, "", connId);
							extras.add(node);
						}
					} catch (Exception e) {
						System.err.println("Load extra level failed: " + extra.getType() + ", error: " + e.getMessage());
					}
				}
			}
		}
		return extras;
	}

	/**
	 * 加载 extraLevels，返回 Map 列表（公共方法，可复用）。
	 */
	public List<Map<String, Object>> loadExtraLevels(Long connId) {
		List<TreeNode> extras = loadExtraLevelsAsTreeNodes(connId);
		return extras.stream()
					 .map(beanUtils::beanToMap)
					 .collect(Collectors.toList());
	}

	/**
	 * 创建虚拟聚合组节点（如 tables_group），并加载其子节点。
	 */
	private TreeNode createVirtualGroupNode(String groupKey, GroupByConfig group, String parentPath, JdbcTemplate jdbc, Long connId) {
		TreeNode groupNode = new TreeNode();
		groupNode.setId(connId + "::group::" + groupKey);
		groupNode.setName(group.getLabel());
		groupNode.setType(group.getType());  // e.g., "table_group"
		groupNode.setVirtual(true);
		groupNode.setIcon(group.getIcon());
		groupNode.setConnected(true);

		// 注入 actions 配置
		groupNode.setConfig(getActionsFromConfig(group.getActions()));

		// 加载组子节点（递归执行 group SQL）
		try {
			String sql = replacePlaceholders(group.getSqlQuery(), parentPath, parentPath.split("/"));
			List<Map<String, Object>> rows = jdbc.queryForList(sql);
			List<TreeNode> groupChildren = new ArrayList<>();
			for (Map<String, Object> row : rows) {
				TreeNode child = createLeafNode(row, group.getChildConfig(), parentPath + "/" + groupKey, connId);
				groupChildren.add(child);
			}
			groupNode.setChildren(groupChildren);
		} catch (Exception e) {
			System.err.println("Load group children failed for: " + groupKey + ", error: " + e.getMessage());
			groupNode.setChildren(Collections.emptyList());
		}

		return groupNode;
	}

	/**
	 * 从 SQL 行数据创建叶子节点。
	 */
	private TreeNode createLeafNode(Map<String, Object> row, Object levelConfig, String parentPath, Long connId) {
		TreeNode node = new TreeNode();
		node.setId(connId + "::" + parentPath + "::" + row.getOrDefault("id", row.get("name")));
		node.setName((String) row.getOrDefault("name", ""));
		node.setType(levelConfig instanceof Level ? ((Level) levelConfig).getType() : ((ChildConfig) levelConfig).getType());
		if (row.containsKey("subType")) {
			node.setSubType((String) row.get("subType"));
		}
		node.setIcon(levelConfig instanceof Level ? ((Level) levelConfig).getIcon() : ((ChildConfig) levelConfig).getIcon());
		node.setConnected(true);  // 继承连接状态
		node.setExpanded(false);  // 默认未展开

		// 注入 actions 配置
		node.setConfig(getActionsFromConfig(levelConfig));

		return node;
	}

	/**
	 * 将 Connection 实体转为 TreeNode。
	 */
	private TreeNode toTreeNode(com.deego.model.Connection conn) {
		TreeNode node = new TreeNode();
		node.setId(String.valueOf(conn.getId()));
		node.setName(conn.getName());
		node.setType("connection");
		node.setDbType(conn.getDbType());
		node.setHost(conn.getHost());
		node.setPort(conn.getPort());
		node.setDatabase(conn.getDatabase());
		node.setUsername(conn.getUsername());
		node.setConnected(conn.getConnected());
		node.setParentId(conn.getParentId());
		node.setExpanded(false);
		node.setChildren(new ArrayList<>());  // 初始空

		// 注入 connection 级 config（从 YAML 取 icon/actions）
		DbConfig dbConfig = configLoader.getDbConfig(conn.getDbType());
		if (dbConfig != null) {
			node.setIcon(dbConfig.getIcon());
			// actions 可从 YAML 扩展
			node.setConfig(new Actions());  // 占位，实际注入 primary/menu
		}

		return node;
	}

	/**
	 * 创建文件夹节点（暂静态，实际可从 DB）。
	 */
	private TreeNode createFolder(String name, Long parentId) {
		TreeNode folder = new TreeNode();
		folder.setId("folder_" + UUID.randomUUID().toString().substring(0, 8));
		folder.setName(name);
		folder.setType("folder");
		folder.setParentId(parentId);
		folder.setExpanded(false);
		folder.setChildren(new ArrayList<>());
		return folder;
	}

	/**
	 * 根据 segments 查找当前层级（简化：基于长度匹配 levels 索引）。
	 * 实际可优化为精确路径匹配。
	 */
	private Level findCurrentLevel(List<Level> levels, String[] segments) {
		int levelIndex = Math.min(segments.length, levels.size() - 1);
		return levels.get(levelIndex);
	}

	/**
	 * 替换 SQL 中的占位符（如 {schemaName}）。
	 */
	private String replacePlaceholders(String sql, String path, String[] segments) {
		// 示例替换：{schemaName} -> segments[1] (假设 segments[0]="database", [1]="mydb", [2]="schema")
		Map<String, String> placeholders = new HashMap<>();
		if (segments.length > 1) {
			placeholders.put("schemaName", segments[segments.length - 1]);  // 最后一个为当前 schema
			placeholders.put("dbName", segments.length > 0 ? segments[0] : "");  // 数据库名
			// 扩展：{connId} -> path 等
		}
		for (Map.Entry<String, String> entry : placeholders.entrySet()) {
			sql = sql.replace("{" + entry.getKey() + "}", entry.getValue());
		}
		return sql;
	}

	/**
	 * 从配置对象提取 Actions。
	 */
	private Actions getActionsFromConfig(Object config) {
		if (config instanceof Level) {
			return ((Level) config).getActions();
		} else if (config instanceof ChildConfig) {
			return ((ChildConfig) config).getActions();
		} else if (config instanceof ExtraLevel) {
			return ((ExtraLevel) config).getActions();
		}
		return new Actions();  // 默认空
	}

	/**
	 * 获取连接的 DB 类型。
	 */
	private String getDbType(Long connId) {
		return connectionService.getConnection(connId)
								.map(com.deego.model.Connection::getDbType)
								.orElse("POSTGRESQL");  // 默认
	}
}