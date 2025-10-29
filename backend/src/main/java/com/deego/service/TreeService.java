package com.deego.service;

import com.deego.config.*;
import com.deego.enums.DatabaseType;
import com.deego.enums.NodeType;
import com.deego.enums.PlaceholderType;
import com.deego.model.Folder;
import com.deego.model.TreeNode;
import com.deego.utils.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 树结构服务：基于 YAML 配置动态构建树节点，支持懒加载和聚合组。
 * 所有操作使用真实数据库（H2），无模拟。
 */
@Service
public class TreeService {

	@Autowired
	private ConnectionService connectionService;

	@Autowired
	private TreeConfigLoader configLoader;

	@Autowired
	private BeanUtils beanUtils;

	@Autowired
	private FolderService folderService;  // 新增：真实文件夹服务

	/**
	 * /api/config/tree: 返回根树数据（真实文件夹 + 连接）。
	 * 递归加载文件夹树，并为每个文件夹添加子连接。
	 * 返回 List<Map<String, Object>>，使用 BeanUtils 转换。
	 */
	public List<Map<String, Object>> getTreeData() {
		// 加载根文件夹（parentId = null）
		List<TreeNode> rootNodes = new ArrayList<>();
		List<Folder> rootFolders = folderService.getRootFolders();
		for (Folder folder : rootFolders) {
			TreeNode folderNode = buildFolderTree(folder);
			rootNodes.add(folderNode);
		}

		// 添加无父文件夹的根连接（parentId = null）
		List<com.deego.model.Connection> rootConns = connectionService.getAllConnections().stream()
																	  .filter(c -> c.getParentId() == null)
																	  .collect(Collectors.toList());
		for (com.deego.model.Connection conn : rootConns) {
			TreeNode connNode = toTreeNode(conn);
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
	 * 递归构建文件夹树节点（真实 DB，加载子文件夹 + 子连接）。
	 */
	private TreeNode buildFolderTree(Folder folder) {
		TreeNode folderNode = toTreeNodeFromFolder(folder);
		// 加载子文件夹（递归）
		List<Folder> childFolders = folderService.getChildFolders(folder.getId());
		List<TreeNode> childNodes = new ArrayList<>();
		for (Folder childFolder : childFolders) {
			TreeNode childFolderNode = buildFolderTree(childFolder);
			childNodes.add(childFolderNode);
		}
		// 加载该文件夹下的连接
		List<com.deego.model.Connection> childConns = connectionService.getAllConnections().stream()
																	   .filter(c -> c.getParentId() != null && c.getParentId().equals(folder.getId()))
																	   .toList();
		for (com.deego.model.Connection conn : childConns) {
			TreeNode connNode = toTreeNode(conn);
			List<TreeNode> extraTreeNodes = loadExtraLevelsAsTreeNodes(conn.getId());
			connNode.setChildren(extraTreeNodes);
			childNodes.add(connNode);
		}
		folderNode.setChildren(childNodes);
		return folderNode;
	}

	/**
	 * /api/meta/{connId}/{path}/children: 动态加载子节点（真实 SQL 执行）。
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
				// 普通层：执行真实 SQL 查询
				String sql = replacePlaceholders(currentLevel.getSqlQuery(), path, segments);
				List<Map<String, Object>> rows = jdbc.queryForList(sql);
				for (Map<String, Object> row : rows) {
					TreeNode node = createLeafNode(row, currentLevel, path, connId);
					children.add(node);
				}
			}

			// 使用枚举替换魔法字符串
			NodeType pathType = NodeType.fromPath(path);
			if (pathType == NodeType.CONNECTION) {
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
			throw new RuntimeException("加载子节点失败: " + e.getMessage(), e);  // 抛出，交由全局异常处理器
		}
	}

	/**
	 * 加载 extraLevels（如 publications, roles），返回 TreeNode 列表（内部使用）。
	 */
	private List<TreeNode> loadExtraLevelsAsTreeNodes(Long connId) {
		List<TreeNode> extras = new ArrayList<>();
		DbConfig dbConfig = configLoader.getDbConfig(getDbType(connId));
		JdbcTemplate jdbc = connectionService.getJdbcTemplate(connId);

		if (dbConfig.getExtraLevels() != null && !dbConfig.getExtraLevels().isEmpty()) {
			for (Map.Entry<String, ExtraLevel> entry : dbConfig.getExtraLevels().entrySet()) {
				String extraKey = entry.getKey();  // e.g., "publications"
				ExtraLevel extra = entry.getValue();
				if (NodeType.CONNECTION.getValue().equals(extra.getPosition())) {
					try {
						String sql = replacePlaceholders(extra.getSqlQuery(), "", new String[0]);
						List<Map<String, Object>> rows = jdbc.queryForList(sql);
						for (Map<String, Object> row : rows) {
							TreeNode node = createLeafNode(row, extra, extraKey, connId);  // 路径用 extraKey
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
	 * 创建虚拟聚合组节点（如 tables_group），并加载其子节点（真实 SQL）。
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
	 * 将 Fodler 实体转为 TreeNode。
	 */
	private TreeNode toTreeNodeFromFolder(Folder folder) {
		TreeNode node = new TreeNode();
		node.setId(String.valueOf(folder.getId()));
		node.setName(folder.getName());
		node.setType(NodeType.FOLDER.getValue());
		node.setParentId(folder.getParentId());
		node.setExpanded(false);
		node.setChildren(new ArrayList<>());
		return node;
	}

	/**
	 * 将 Connection 实体转为 TreeNode。
	 */
	private TreeNode toTreeNode(com.deego.model.Connection conn) {
		TreeNode node = new TreeNode();
		node.setId(String.valueOf(conn.getId()));
		node.setName(conn.getName());
		node.setType(NodeType.CONNECTION.getValue());
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
		Map<String, String> placeholders = new HashMap<>();
		if (segments.length > 1) {
			placeholders.put(PlaceholderType.SCHEMA_NAME.getKey(), segments[segments.length - 1]);
			placeholders.put(PlaceholderType.DB_NAME.getKey(), segments.length > 0 ? segments[0] : "");
		}
		// 遍历枚举替换（扩展点：所有 PlaceholderType）
		for (PlaceholderType placeholder : PlaceholderType.values()) {
			String key = placeholder.getKey();
			if (placeholders.containsKey(key)) {
				sql = sql.replace(placeholder.getValue(), placeholders.get(key));
			}
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
								.map(DatabaseType::fromValue)
								.map(DatabaseType::getValue)
								.orElse(DatabaseType.POSTGRESQL.getValue());  // 默认枚举
	}
}