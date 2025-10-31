package com.deego.service;

import com.deego.config.*;
import com.deego.enums.DatabaseType;
import com.deego.enums.NodeType;
import com.deego.enums.PlaceholderType;
import com.deego.exception.BizException;
import com.deego.model.Folder;
import com.deego.model.TreeNode;
import com.deego.utils.BeanUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TreeService {

	@Autowired
	private ConnectionService connectionService;

	@Autowired
	private TreeConfigLoader configLoader;

	@Autowired
	private BeanUtils beanUtils;

	@Autowired
	private FolderService folderService;

	public List<Map<String, Object>> getTreeData() {
		List<TreeNode> rootNodes = new ArrayList<>();
		List<Folder> rootFolders = folderService.getRootFolders();
		for (Folder folder : rootFolders) {
			rootNodes.add(buildFolderTree(folder));
		}

		List<com.deego.model.Connection> rootConns = connectionService.getAllConnections().stream()
																	  .filter(c -> c.getParentId() == null)
																	  .collect(Collectors.toList());
		for (com.deego.model.Connection conn : rootConns) {
			TreeNode connNode = toTreeNode(conn);
			connNode.setChildren(loadExtraLevelsAsTreeNodes(conn.getId()));
			rootNodes.add(connNode);
		}

		return rootNodes.stream()
						.map(beanUtils::beanToMap)
						.collect(Collectors.toList());
	}

	private TreeNode buildFolderTree(Folder folder) {
		TreeNode folderNode = toTreeNodeFromFolder(folder);
		List<Folder> childFolders = folderService.getChildFolders(folder.getId());
		List<TreeNode> childNodes = new ArrayList<>();
		for (Folder childFolder : childFolders) {
			childNodes.add(buildFolderTree(childFolder));
		}
		List<com.deego.model.Connection> childConns = connectionService.getAllConnections().stream()
																	   .filter(c -> c.getParentId() != null && c.getParentId().equals(folder.getId()))
																	   .toList();
		for (com.deego.model.Connection conn : childConns) {
			TreeNode connNode = toTreeNode(conn);
			connNode.setChildren(loadExtraLevelsAsTreeNodes(conn.getId()));
			childNodes.add(connNode);
		}
		folderNode.setChildren(childNodes);
		return folderNode;
	}

	public List<Map<String, Object>> loadChildren(String connIdStr, String path) {
		log.debug("Loading children for connId={}, path={}", connIdStr, path);  // 优化：加日志
		JdbcTemplate jdbc = connectionService.getJdbcTemplate(connIdStr);
		DbConfig dbConfig = configLoader.getDbConfig(getDbType(connIdStr));

		List<TreeNode> children = new ArrayList<>();
		String[] segments = Objects.isNull(path) ? new String[0] : path.split("/");
		Level currentLevel = findCurrentLevel(dbConfig.getLevels(), segments);

		try {
			if (currentLevel.getGroupBy() != null && !currentLevel.getGroupBy().isEmpty()) {
				for (Map.Entry<String, GroupByConfig> entry : currentLevel.getGroupBy().entrySet()) {
					String groupKey = entry.getKey();
					GroupByConfig group = entry.getValue();
					TreeNode groupNode = createVirtualGroupNode(groupKey, group, path, jdbc, connIdStr);
					children.add(groupNode);
				}
			} else {
				String sql = replacePlaceholders(currentLevel.getSqlQuery(), segments);
				List<Map<String, Object>> rows = jdbc.queryForList(sql);
				for (Map<String, Object> row : rows) {
					TreeNode node = createLeafNode(row, currentLevel, path, connIdStr);
					children.add(node);
				}
			}

			NodeType pathType = NodeType.fromPath(path);
			if (pathType == NodeType.CONNECTION) {
				children.addAll(loadExtraLevelsAsTreeNodes(connIdStr));
			}

			return children.stream()
						   .map(beanUtils::beanToMap)
						   .collect(Collectors.toList());

		} catch (Exception e) {
			log.error("加载子节点失败 for connId={}, path={}: ", connIdStr, path, e);  // 优化：加上下文日志
			throw new BizException(e);
		}
	}

	private List<TreeNode> loadExtraLevelsAsTreeNodes(String connId) {
		List<TreeNode> extras = new ArrayList<>();
		DbConfig dbConfig = configLoader.getDbConfig(getDbType(connId));
		JdbcTemplate jdbc = connectionService.getJdbcTemplate(connId);

		if (dbConfig.getExtraLevels() != null && !dbConfig.getExtraLevels().isEmpty()) {
			for (Map.Entry<String, ExtraLevel> entry : dbConfig.getExtraLevels().entrySet()) {
				String extraKey = entry.getKey();
				ExtraLevel extra = entry.getValue();
				if (NodeType.CONNECTION.getValue().equals(extra.getPosition())) {
					try {
						String sql = replacePlaceholders(extra.getSqlQuery(), new String[0]);
						List<Map<String, Object>> rows = jdbc.queryForList(sql);
						for (Map<String, Object> row : rows) {
							TreeNode node = createLeafNode(row, extra, "", connId);  // 修复：parentPath = ""
							extras.add(node);
						}
					} catch (Exception e) {
						log.error("加载额外层级失败 for extraKey={}, connId={}: ", extraKey, connId, e);  // 优化：加日志
					}
				}
			}
		}
		return extras;
	}

	public List<Map<String, Object>> loadExtraLevels(String connId) {
		List<TreeNode> extras = loadExtraLevelsAsTreeNodes(connId);
		return extras.stream().map(beanUtils::beanToMap).collect(Collectors.toList());
	}

	private TreeNode createVirtualGroupNode(String groupKey, GroupByConfig group, String parentPath, JdbcTemplate jdbc, String connId) {
		TreeNode groupNode = new TreeNode();
		groupNode.setId(connId + "::group::" + groupKey);
		groupNode.setName(group.getLabel());
		groupNode.setType(group.getType());
		groupNode.setVirtual(true);
		groupNode.setIcon(group.getIcon());
		groupNode.setConnected(true);
		groupNode.setConfig(getActionsFromConfig(group.getActions()));

		try {
			String sql = replacePlaceholders(group.getSqlQuery(), parentPath.split("/"));
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

	private TreeNode createLeafNode(Map<String, Object> row, Object levelConfig, String parentPath, String connId) {
		parentPath = Objects.isNull(parentPath) ? "" : parentPath;
		TreeNode node = new TreeNode();
		// 优化：统一取 id 或 name，避免 null
		String rawId = Optional.ofNullable((String) row.get("id")).orElseGet(() -> (String) row.get("name"));
		String name = Optional.ofNullable((String) row.get("name")).orElse(rawId);
		String uniqueKey = parentPath.isEmpty() ? rawId : parentPath + "/" + rawId;
		node.setId(connId + "::" + uniqueKey);
		node.setName(name);
		// 修复：添加 ExtraLevel 支持
		if (levelConfig instanceof Level) {
			node.setType(((Level) levelConfig).getType());
			node.setIcon(((Level) levelConfig).getIcon());
		} else if (levelConfig instanceof ChildConfig) {
			node.setType(((ChildConfig) levelConfig).getType());
			node.setIcon(((ChildConfig) levelConfig).getIcon());
		} else if (levelConfig instanceof ExtraLevel) {  // 新增：支持 ExtraLevel
			node.setType(((ExtraLevel) levelConfig).getType());
			node.setIcon(((ExtraLevel) levelConfig).getIcon());
		} else {
			node.setType("unknown");  // 兜底
			node.setIcon("default_icon.svg");
		}
		if (row.containsKey("subType")) {
			node.setSubType((String) row.get("subType"));
		}
		node.setConnected(true);
		node.setExpanded(false);
		node.setConfig(getActionsFromConfig(levelConfig));
		return node;
	}

	private TreeNode toTreeNodeFromFolder(Folder folder) {
		TreeNode node = new TreeNode();
		node.setId(folder.getId());
		node.setName(folder.getName());
		node.setType(NodeType.FOLDER.getValue());
		node.setParentId(folder.getParentId());
		node.setExpanded(false);
		node.setChildren(new ArrayList<>());
		return node;
	}

	private TreeNode toTreeNode(com.deego.model.Connection conn) {
		TreeNode node = new TreeNode();
		node.setId(conn.getId());
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
		node.setChildren(new ArrayList<>());

		DbConfig dbConfig = configLoader.getDbConfig(conn.getDbType());
		if (dbConfig != null) {
			node.setIcon(dbConfig.getIcon());
			node.setConfig(new Actions());
		}
		return node;
	}

	private Level findCurrentLevel(List<Level> levels, String[] segments) {
		int levelIndex = Math.min(segments.length, levels.size() - 1);
		return levels.get(levelIndex);
	}

	private String replacePlaceholders(String sql, String[] segments) {
		Map<String, String> placeholders = new HashMap<>();
		if (segments.length >= 1) {
			placeholders.put(PlaceholderType.DB_NAME.getKey(), segments[0]);
		}
		if (segments.length > 1) {
			placeholders.put(PlaceholderType.SCHEMA_NAME.getKey(), segments[segments.length - 1]);
		}
		// 新增：支持 connId（从外部传入，或默认）
		placeholders.put(PlaceholderType.CONN_ID.getKey(), "当前连接ID");
		for (PlaceholderType placeholder : PlaceholderType.values()) {
			String key = placeholder.getKey();
			if (placeholders.containsKey(key)) {
				sql = sql.replace(placeholder.getValue(), placeholders.get(key));
			}
		}
		return sql;
	}

	private Actions getActionsFromConfig(Object config) {
		if (config instanceof Level) {
			return ((Level) config).getActions();
		} else if (config instanceof ChildConfig) {
			return ((ChildConfig) config).getActions();
		} else if (config instanceof ExtraLevel) {
			return ((ExtraLevel) config).getActions();
		}
		return new Actions();
	}

	private String getDbType(String connId) {
		return connectionService.getConnection(connId)
								.map(com.deego.model.Connection::getDbType)
								.map(DatabaseType::fromValue)
								.map(DatabaseType::getValue)
								.orElse(DatabaseType.POSTGRESQL.getValue());
	}
}