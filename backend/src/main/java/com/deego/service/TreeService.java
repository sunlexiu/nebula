package com.deego.service;

import com.deego.config.DbConfig;
import com.deego.config.NodeDef;
import com.deego.config.TreeConfigLoader;
import com.deego.exception.BizException;
import com.deego.model.Connection;
import com.deego.model.Folder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Nodes-registry tree engine with back-compat getTreeData().
 */
@Slf4j
@Service
public class TreeService {

    @Autowired
    private TreeConfigLoader configLoader;

    @Autowired
    private ConnectionService connectionService;

    @Autowired
    private com.deego.utils.BeanUtils beanUtils;

    @Autowired
    private FolderService folderService;

    /** /api/config/tree 需要的根树：Folders + Root Connections */
    public List<Map<String, Object>> getTreeData() {
        List<Map<String, Object>> roots = new ArrayList<>();
        // folders
        for (Folder f : folderService.getRootFolders()) {
            roots.add(buildFolderMap(f));
        }
        // root connections
        for (Connection conn : connectionService.getAllConnections().stream()
                .filter(c -> c.getParentId() == null).toList()) {
            roots.add(connectionNodeMap(conn));
        }
        return roots;
    }

    private Map<String, Object> buildFolderMap(Folder folder) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", folder.getId());
        m.put("key", String.valueOf(folder.getId()));
        m.put("name", folder.getName());
        m.put("type", "folder");
        m.put("icon", null);
        m.put("virtual", true);
        m.put("connected", true);
        List<Map<String,Object>> children = new ArrayList<>();

        for (Folder cf : folderService.getChildFolders(folder.getId())) {
            children.add(buildFolderMap(cf));
        }
        for (Connection c : connectionService.getAllConnections().stream()
                .filter(c -> c.getParentId() != null && c.getParentId().equals(folder.getId()))
                .toList()) {
            children.add(connectionNodeMap(c));
        }
        m.put("children", children);
        return m;
    }

    private Map<String, Object> connectionNodeMap(Connection conn) {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", conn.getId());                 // 只返回连接层级
        m.put("key", conn.getId());
        m.put("name", conn.getName() != null ? conn.getName() : conn.getId());
        m.put("type", "connection");
        m.put("icon", null);                       // 不写死；前端按 dbType 映射图标
        m.put("dbType", conn.getDbType());        // 关键：让前端映射出大象/海豚等
        m.put("virtual", false);
        m.put("connected", conn.getConnected() != null ? conn.getConnected() : Boolean.TRUE);
        m.put("children", new java.util.ArrayList<>()); // 不预载虚拟节点
        return m;
    }


    /** Expand children for a given connection/path using the nodes registry. */
    public List<Map<String, Object>> loadChildren(String connId, String path) {
        Connection conn = connectionService.getConnection(connId).orElseThrow(() -> new BizException("Connection not found: " + connId));
        DbConfig db = configLoader.getDbConfig(conn.getDbType());
        if (db == null) throw new BizException("DbConfig not found for dbType " + conn.getDbType());
        LinkedHashMap<String, NodeDef> reg = db.getNodes();
        if (reg == null || reg.isEmpty()) return List.of();

        if (path == null || path.isBlank()) {
            return reg.entrySet().stream()
                    .filter(e -> e.getValue().getParent() == null)
                    .sorted(Comparator.comparingInt(e -> Optional.ofNullable(e.getValue().getPosition()).orElse(0)))
                    .map(e -> toNodeMap(conn, e.getKey(), e.getValue(), null))
                    .toList();
        }
        List<String> segs = new ArrayList<>(Arrays.asList(path.split("/")));
        String nodeKey = segs.get(0);
        NodeDef def = reg.get(nodeKey);
        if (def == null) throw new BizException("Unknown node key: " + nodeKey);

        if (segs.size() == 1) {
            return expandNode(conn, reg, nodeKey, def, null);
        }
        String entityId = segs.get(1);
        return expandEntity(conn, reg, nodeKey, def, entityId);
    }

    private List<Map<String, Object>> expandNode(Connection conn, LinkedHashMap<String, NodeDef> reg, String nodeKey, NodeDef def, String parentId) {
        if (def.isVirtual() && def.getChildren() != null && !def.getChildren().isEmpty()) {
            return def.getChildren().entrySet().stream()
                      .map(e -> {
                          String alias = e.getKey();       // YAML 中的别名，如 "users"
                          String childKey = e.getValue();  // 真正的节点 key，如 "users_real"
                          NodeDef childDef = reg.get(childKey);

                          Map<String, Object> m = toNodeMap(conn, childKey, childDef, parentId);

                          // 用别名作为展示名（首字母大写，_ 转空格）
                          if (alias != null && !alias.isBlank() && !alias.equals(childKey)) {
                              String pretty = alias.replace('_', ' ');
                              pretty = pretty.substring(0, 1).toUpperCase() + pretty.substring(1);
                              m.put("name", pretty);  // “Users”
                          }

                          // 若虚拟子分组有 nextLevel，则透传到 config，让前端识别为可展开
                          if (childDef != null && childDef.getNextLevel() != null) {
                              @SuppressWarnings("unchecked")
                              Map<String, Object> cfg = (Map<String, Object>) m.get("config");
                              if (cfg != null) cfg.put("nextLevel", childDef.getNextLevel());
                          }
                          return m;
                      })
                      .collect(Collectors.toList());
        }
        if (def.isVirtual() && def.getNextLevel() != null) {
            String nextKey = def.getNextLevel();
            NodeDef nextDef = reg.get(nextKey);
            return queryList(conn, reg, nextKey, nextDef, parentId, Collections.emptyMap());
        }
        if (!def.isVirtual()) {
            return queryList(conn, reg, nodeKey, def, parentId, Collections.emptyMap());
        }
        return List.of();
    }

    private List<Map<String, Object>> expandEntity(Connection conn, LinkedHashMap<String, NodeDef> reg, String nodeKey, NodeDef def, String entityId) {
        if (!def.isVirtual()) {
            if (def.getNextLevel() != null) {
                NodeDef next = reg.get(def.getNextLevel());
                if (next == null) return List.of();
                if (next.getChildren() != null && !next.getChildren().isEmpty()) {
                    return next.getChildren().entrySet().stream()
                            .map(e -> {
                                String childKey = e.getValue();
                                NodeDef childDef = reg.get(childKey);
                                String id = conn.getId() + "::" + childKey + "::" + entityId;
                                Map<String, Object> m = toNodeMap(conn, childKey, childDef, entityId);
                                m.put("id", id);
                                m.put("key", id);
                                Map<String, Object> cfg = (Map<String, Object>) m.get("config");
                                if (cfg != null && childDef.getNextLevel() != null) {
                                    cfg.put("nextLevel", childDef.getNextLevel());
                                }
                                return m;
                            }).collect(Collectors.toList());
                }
                if (next.getNextLevel() != null) {
                    NodeDef deeper = reg.get(next.getNextLevel());
                    return queryList(conn, reg, def.getNextLevel(), deeper, entityId, Map.of("entityId", entityId));
                }
            }
            return List.of();
        }
        return expandNode(conn, reg, nodeKey, def, entityId);
    }

    private List<Map<String, Object>> queryList(Connection conn,
                                                LinkedHashMap<String, NodeDef> reg,
                                                String nodeKey, NodeDef def,
                                                String parentId, Map<String, Object> params) {
        if (def == null || def.getSqlQuery() == null) return List.of();

        String ctxDb = null, ctxSchema = null;
        if (parentId != null && !parentId.isBlank()) {
            int dot = parentId.indexOf('.');
            if (dot > 0) {
                ctxDb = parentId.substring(0, dot);
                ctxSchema = parentId.substring(dot + 1);
            } else {
                ctxDb = parentId;
            }
        }

        String sql = def.getSqlQuery();
        if (params.containsKey("entityId")) sql = sql.replace("{entityId}", String.valueOf(params.get("entityId")));
        if (parentId != null) sql = sql.replace("{parentId}", parentId);
        String effectiveDb = (ctxDb != null && !ctxDb.isBlank()) ? ctxDb : conn.getDatabase();
        sql = sql.replace("{dbName}", effectiveDb);
        if (ctxSchema != null) sql = sql.replace("{schemaName}", ctxSchema);

        org.springframework.jdbc.core.JdbcTemplate jdbc =
            (ctxDb != null && !ctxDb.isBlank() && !ctxDb.equals(conn.getDatabase()))
                ? connectionService.getJdbcTemplate(conn.getId(), ctxDb)
                : connectionService.getJdbcTemplate(conn.getId());

        java.util.List<java.util.Map<String, Object>> rows = jdbc.queryForList(sql);
        java.util.List<java.util.Map<String, Object>> out = new java.util.ArrayList<>(rows.size());
        for (java.util.Map<String, Object> r : rows) {
            java.util.Map<String, Object> m2 = new java.util.LinkedHashMap<>();
            String id = String.valueOf(r.getOrDefault("id", java.util.UUID.randomUUID().toString()));
            String name = String.valueOf(r.getOrDefault("name", id));
            String compound = conn.getId() + "::" + nodeKey + "::" + id;
            m2.put("id", compound);
            m2.put("key", compound);
            m2.put("name", name);
            m2.put("type", def.getType());
            m2.put("icon", def.getIcon());
            java.util.Map<String, Object> cfg = new java.util.LinkedHashMap<>();
            cfg.put("type", def.getType());
            if (def.getIcon() != null) cfg.put("icon", def.getIcon());
            if (def.getActions() != null) cfg.put("actions", def.getActions());
            if (def.getNextLevel() != null) cfg.put("nextLevel", def.getNextLevel());
            else if (!def.isVirtual() && def.getSqlQuery() != null) cfg.put("nextLevel", nodeKey);
            m2.put("config", cfg);
            m2.put("virtual", false);
            m2.put("connected", conn.getConnected() != null ? conn.getConnected() : Boolean.TRUE);
            m2.put("children", new java.util.ArrayList<>());
            out.add(m2);
        }
        return out;
    }

    private Map<String, Object> toNodeMap(Connection conn, String key, NodeDef def, String parentId) {
        Map<String, Object> m = new LinkedHashMap<>();
        String id = (parentId == null)
                ? conn.getId() + "::" + key
                : conn.getId() + "::" + key + "::" + parentId;
        m.put("id", id);
        m.put("key", id);
        m.put("name", def.getLabel() != null ? def.getLabel() : def.getType());
        m.put("type", def.getType());
        m.put("icon", def.getIcon());
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("type", def.getType());
        if (def.getIcon() != null) cfg.put("icon", def.getIcon());
        if (def.getActions() != null) cfg.put("actions", def.getActions());
        if (def.getNextLevel() != null) {
            cfg.put("nextLevel", def.getNextLevel());
        } else if (!def.isVirtual() && def.getSqlQuery() != null) {
            cfg.put("nextLevel", key);
        }
        m.put("config", cfg);
        m.put("virtual", def.isVirtual());
        boolean isConnectionType = "connection".equalsIgnoreCase(def.getType());
        m.put("connected", isConnectionType
                ? (conn.getConnected() != null ? conn.getConnected() : Boolean.TRUE)
                : Boolean.TRUE);
        m.put("children", new ArrayList<>());
        return m;
    }

    private String entityScopedId(String parentKey, String entityId, String childKey) {
        return parentKey + "/" + entityId + "::" + childKey;
    }
}

// =========================================
