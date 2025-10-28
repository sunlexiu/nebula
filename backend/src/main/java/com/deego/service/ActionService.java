package com.deego.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.function.BiConsumer;

@Service
public class ActionService {
	@Autowired
	private ConnectionService connectionService;

	private final Map<String, BiConsumer<JdbcTemplate, Map<String, Object>>> handlers = new HashMap<>();

	public ActionService() {
		// 注册 handlers (扩展点：易加新动作)
		handlers.put("refreshDatabase", (jdbc, params) -> { /* NOP, 前端刷新 */ });
		handlers.put("createNewSchema", (jdbc, params) -> {
			String schemaName = (String) params.get("schemaName");
			jdbc.update("CREATE SCHEMA IF NOT EXISTS " + schemaName);
		});
		handlers.put("exportDatabase", (jdbc, params) -> { /* 生成 DDL SQL */ });
		handlers.put("deleteDatabase", (jdbc, params) -> {
			String dbName = (String) params.get("dbName");
			jdbc.update("DROP DATABASE IF EXISTS " + dbName);
		});
		handlers.put("refreshSchema", (jdbc, params) -> { /* NOP */ });
		handlers.put("createNewTable", (jdbc, params) -> {
			// 示例：CREATE TABLE ... (params 有 DDL)
			String ddl = (String) params.get("ddl");
			jdbc.update(ddl);
		});
		handlers.put("createNewView", (jdbc, params) -> {
			String viewName = (String) params.get("viewName");
			String query = (String) params.get("query");
			jdbc.update("CREATE OR REPLACE VIEW " + viewName + " AS " + query);
		});
		handlers.put("createNewFunction", (jdbc, params) -> {
			String funcDdl = (String) params.get("ddl");
			jdbc.update(funcDdl);
		});
		handlers.put("exportSchema", (jdbc, params) -> { /* 生成 Schema DDL */ });
		handlers.put("previewTable", (jdbc, params) -> {
			String schema = (String) params.get("schemaName");
			String table = (String) params.get("objectName");
			// 返回数据：jdbc.query("SELECT * FROM " + schema + "." + table + " LIMIT 1000")
		});
		handlers.put("editTableStructure", (jdbc, params) -> { /* ALTER TABLE */ });
		handlers.put("generateTableSQL", (jdbc, params) -> { /* pg_dump */ });
		handlers.put("exportTableData", (jdbc, params) -> { /* COPY TO CSV */ });
		handlers.put("viewDefinition", (jdbc, params) -> {
			String schema = (String) params.get("schemaName");
			String view = (String) params.get("objectName");
			jdbc.queryForObject("SELECT pg_get_viewdef('" + schema + "." + view + "'::regclass)", String.class);
		});
		handlers.put("editView", (jdbc, params) -> { /* DROP + CREATE */ });
		handlers.put("generateViewSQL", (jdbc, params) -> { /* pg_get_viewdef */ });
		handlers.put("editFunction", (jdbc, params) -> { /* DROP + CREATE */ });
		handlers.put("viewFunctionSource", (jdbc, params) -> {
			String funcId = (String) params.get("objectName");
			jdbc.queryForObject("SELECT pg_get_functiondef('" + funcId + "'::regproc)", String.class);
		});
		handlers.put("testFunction", (jdbc, params) -> { /* CALL func() */ });
		handlers.put("showProperties", (jdbc, params) -> { /* DESCRIBE */ });
		handlers.put("deleteSchema", (jdbc, params) -> {
			String schemaName = (String) params.get("schemaName");
			jdbc.update("DROP SCHEMA IF EXISTS " + schemaName + " CASCADE");
		});
		handlers.put("deleteTable", (jdbc, params) -> {
			String schema = (String) params.get("schemaName");
			String table = (String) params.get("objectName");
			jdbc.update("DROP TABLE IF EXISTS " + schema + "." + table + " CASCADE");
		});
		handlers.put("deleteView", (jdbc, params) -> {
			String schema = (String) params.get("schemaName");
			String view = (String) params.get("objectName");
			jdbc.update("DROP VIEW IF EXISTS " + schema + "." + view + " CASCADE");
		});
		handlers.put("deleteFunction", (jdbc, params) -> {
			String funcId = (String) params.get("objectName");
			jdbc.update("DROP FUNCTION IF EXISTS " + funcId + " CASCADE");
		});
		handlers.put("refreshMaterializedView", (jdbc, params) -> {
			String schema = (String) params.get("schemaName");
			String mview = (String) params.get("objectName");
			jdbc.update("REFRESH MATERIALIZED VIEW " + schema + "." + mview);
		});
		handlers.put("viewPublication", (jdbc, params) -> { /* SELECT * FROM pg_publication */ });
		handlers.put("createPublication", (jdbc, params) -> {
			String pubName = (String) params.get("pubName");
			jdbc.update("CREATE PUBLICATION " + pubName + " FOR ALL TABLES");
		});
		handlers.put("deletePublication", (jdbc, params) -> {
			String pubName = (String) params.get("pubName");
			jdbc.update("DROP PUBLICATION IF EXISTS " + pubName);
		});
		handlers.put("showRoleProperties", (jdbc, params) -> { /* \du */ });
		handlers.put("createRole", (jdbc, params) -> {
			String roleName = (String) params.get("roleName");
			jdbc.update("CREATE ROLE " + roleName + " LOGIN PASSWORD 'password'");
		});
		handlers.put("deleteRole", (jdbc, params) -> {
			String roleName = (String) params.get("roleName");
			jdbc.update("DROP ROLE IF EXISTS " + roleName);
		});
	}

	// /api/db/{handler}
	public String executeAction(String handler, Map<String, Object> params) {
		Long connId = (Long) params.get("connectionId");
		JdbcTemplate jdbc = connectionService.getJdbcTemplate(connId);
		BiConsumer<JdbcTemplate, Map<String, Object>> action = handlers.get(handler);
		if (action != null) {
			action.accept(jdbc, params);
			return "Action '" + handler + "' executed successfully";
		}
		return "Unknown handler: " + handler;
	}
}