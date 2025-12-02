package com.deego.service.action;

import com.deego.enums.DatabaseType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.function.BiConsumer;

/**
 * PostgreSQL 专用的动作处理实现。
 *
 * 目前所有 handler 都是 PG 风格（pg_get_viewdef、publication、role 等），
 * 未来 MySQL 等可以单独再实现对应的 DatabaseActionService。
 */
@Service
public class PostgreSqlActionService implements DatabaseActionService {

	private final Map<String, BiConsumer<JdbcTemplate, Map<String, Object>>> handlers = new HashMap<>();

	public PostgreSqlActionService() {
		// 注册 handlers（基本上就是你原来 ActionService 里的内容）

		handlers.put("refreshDatabase", (jdbc, params) -> {
			// NOP，前端自己重新拉取树即可
		});

		handlers.put("createNewSchema", (jdbc, params) -> {
			String schemaName = (String) params.get("schemaName");
			// TODO: 参数校验 & 防 SQL 注入（后面再细化）
			jdbc.update("CREATE SCHEMA IF NOT EXISTS " + schemaName);
		});

		handlers.put("exportDatabase", (jdbc, params) -> {
			// 生成 DDL SQL（未来可以对接 pg_dump）
		});

		handlers.put("deleteDatabase", (jdbc, params) -> {
			String dbName = (String) params.get("dbName");
			jdbc.update("DROP DATABASE IF EXISTS " + dbName);
		});

		handlers.put("refreshSchema", (jdbc, params) -> {
			// NOP
		});

		handlers.put("createNewTable", (jdbc, params) -> {
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

		handlers.put("exportSchema", (jdbc, params) -> {
			// 生成 Schema DDL（未来扩展）
		});

		handlers.put("previewTable", (jdbc, params) -> {
			String schema = (String) params.get("schemaName");
			String table = (String) params.get("objectName");
			// 这里目前只是示例：真正返回数据需要改接口返回结构
			// jdbc.queryForList("SELECT * FROM " + schema + "." + table + " LIMIT 1000");
		});

		handlers.put("editTableStructure", (jdbc, params) -> {
			// ALTER TABLE ..（结构修改）
		});

		handlers.put("generateTableSQL", (jdbc, params) -> {
			// 生成建表 DDL（可用 pg_get_tabledef / pg_dump 等）
		});

		handlers.put("exportTableData", (jdbc, params) -> {
			// COPY TO CSV 等导出
		});

		handlers.put("viewDefinition", (jdbc, params) -> {
			String schema = (String) params.get("schemaName");
			String view = (String) params.get("objectName");
			// 当前只是执行一下；如果要返回给前端，需要调整为返回值
			jdbc.queryForObject(
					"SELECT pg_get_viewdef('" + schema + "." + view + "'::regclass)",
					String.class
			);
		});

		handlers.put("editView", (jdbc, params) -> {
			// DROP + CREATE VIEW
		});

		handlers.put("generateViewSQL", (jdbc, params) -> {
			// pg_get_viewdef 生成 SQL
		});

		handlers.put("editFunction", (jdbc, params) -> {
			// DROP FUNCTION + CREATE FUNCTION
		});

		handlers.put("viewFunctionSource", (jdbc, params) -> {
			String funcId = (String) params.get("objectName");
			jdbc.queryForObject(
					"SELECT pg_get_functiondef('" + funcId + "'::regproc)",
					String.class
			);
		});

		handlers.put("testFunction", (jdbc, params) -> {
			// 调用函数，未来可以加入参数绑定
		});

		handlers.put("showProperties", (jdbc, params) -> {
			// 显示对象属性（\d 之类的效果）
		});

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

		handlers.put("viewPublication", (jdbc, params) -> {
			// SELECT * FROM pg_publication ...
		});

		handlers.put("createPublication", (jdbc, params) -> {
			String pubName = (String) params.get("pubName");
			jdbc.update("CREATE PUBLICATION " + pubName + " FOR ALL TABLES");
		});

		handlers.put("deletePublication", (jdbc, params) -> {
			String pubName = (String) params.get("pubName");
			jdbc.update("DROP PUBLICATION IF EXISTS " + pubName);
		});

		handlers.put("showRoleProperties", (jdbc, params) -> {
			// \du 类似的展示
		});

		handlers.put("createRole", (jdbc, params) -> {
			String roleName = (String) params.get("roleName");
			// TODO: 密码和属性后续要做参数化/加密
			jdbc.update("CREATE ROLE " + roleName + " LOGIN PASSWORD 'password'");
		});

		handlers.put("deleteRole", (jdbc, params) -> {
			String roleName = (String) params.get("roleName");
			jdbc.update("DROP ROLE IF EXISTS " + roleName);
		});
	}

	@Override
	public DatabaseType dbType() {
		return DatabaseType.POSTGRESQL;
	}

	@Override
	public String execute(String handler, JdbcTemplate jdbc, Map<String, Object> params) {
		BiConsumer<JdbcTemplate, Map<String, Object>> action = handlers.get(handler);
		if (action == null) {
			return "Unknown handler: " + handler;
		}
		action.accept(jdbc, params);
		return "Action '" + handler + "' executed successfully";
	}
}
