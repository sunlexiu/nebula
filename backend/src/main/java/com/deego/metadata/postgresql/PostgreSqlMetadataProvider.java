package com.deego.metadata.postgresql;

import com.deego.enums.DatabaseType;
import com.deego.exec.DbExecutor;
import com.deego.metadata.DatabaseNodeType;
import com.deego.metadata.MetadataProvider;
import com.deego.model.Connection;
import com.deego.model.pgsql.PgOption;
import com.deego.service.ConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class PostgreSqlMetadataProvider implements MetadataProvider {

	@Autowired
	private ConnectionService connectionService;

	@Override
	public DatabaseType dbType() {
		return DatabaseType.POSTGRESQL;
	}

	@Override
	public List<Map<String, Object>> listChildren(String connId,
			Connection connection,
			DatabaseNodeType nodeType,
			String[] pathSegments) {

		// pathSegments[0] 默认是 database 名（调用方保证）
		DbExecutor executor = connectionService.getExecutor(
				connId,
				pathSegments.length > 0 ? pathSegments[0] : null
		);

		return switch (nodeType) {
			// ======== 角色相关（实例级） ========
			case LOGIN_ROLE -> listLoginRoles(connId, executor);
			case GROUP_ROLE -> listGroupRoles(connId, executor);
			case SYSTEM_ROLE -> listSystemRoles(connId, executor);

			// ======== 数据库层级 ========
			case DATABASE -> listDatabases(connId, executor);
			case SCHEMA -> listSchemas(connId, executor, pathSegments);
			case TABLE -> listTables(connId, executor, pathSegments);
			case COLUMN -> listColumns(connId, executor, pathSegments);
			case CONSTRAINT -> listConstraints(connId, executor, pathSegments);
			case INDEX -> listIndexes(connId, executor, pathSegments);
			case VIEW -> listViews(connId, executor, pathSegments);
			case MATERIALIZED_VIEW -> listMaterializedViews(connId, executor, pathSegments);
			case SEQUENCE -> listSequences(connId, executor, pathSegments);
			case FUNCTION -> listFunctions(connId, executor, pathSegments);
			case PROCEDURE -> listProcedures(connId, executor, pathSegments);
			default -> List.of();
		};
	}

	@Override
	public PgOption getOptions(Connection connection) {
		PgOption options = new PgOption();
		DbExecutor executor = connectionService.getExecutor(connection.getId());
		try {
			// ============= 1. 编码（列出 PG 支持的编码，而不是仅当前库用到的） =============
			List<String> encodings = executor.queryForList("SELECT DISTINCT pg_encoding_to_char(conforencoding)" +
					" AS encoding FROM pg_conversion ORDER BY encoding", String.class);
			options.setEncodings(encodings);

			// ============= 2. 模板库（template0 / template1 等） =============
			List<Map<String, Object>> templateResults =
					executor.queryMapForList("SELECT datname FROM pg_database WHERE datistemplate = true ORDER BY datname");
			List<String> templates = templateResults.stream().map(map -> (String)map.get("datname")).filter(Objects::nonNull).collect(Collectors.toList());
			options.setTemplates(templates);

			// ============= 3. 表空间 =============
			List<Map<String, Object>> tablespaceResults = executor.queryMapForList("SELECT spcname FROM pg_tablespace ORDER BY spcname");
			List<String> tablespaces = tablespaceResults.stream().map(map -> (String)map.get("spcname")).filter(Objects::nonNull).collect(Collectors.toList());
			options.setTablespaces(tablespaces);

			// ============= 4. 角色 =============
			List<Map<String, Object>> roleResults = executor.queryMapForList("SELECT rolname FROM pg_roles ORDER BY rolname");
			List<String> roles = roleResults.stream().map(map -> (String)map.get("rolname")).filter(Objects::nonNull).collect(Collectors.toList());
			options.setRoles(roles);

			// ============= 5. 排序规则（collations） =============
			// 这里先简单按 UTF8 过滤；如果以后支持多编码，可以把 encoding 作为参数传进来
			List<Map<String, Object>> collationResults = executor.queryMapForList(
					"SELECT collname, collprovider " + "FROM pg_collation "
							+ "WHERE collencoding IN (-1, pg_char_to_encoding('UTF8')) " + "ORDER BY collname");
			List<String> collations = collationResults.stream().map(map -> (String)map.get("collname")).filter(Objects::nonNull).collect(Collectors.toList());
			options.setCollations(collations);

			// ============= 6. Locale Provider（libc / icu） =============
			List<String> localeProviders = collationResults.stream().map(map -> (String)map.get("collprovider")).filter(Objects::nonNull).distinct().map(p -> {
				switch (p) {
					case "i":
						return "icu";
					case "c":
						return "libc";
					default:
						return p;
				}
			}).collect(Collectors.toList());
			options.setLocaleProviders(localeProviders);

		} catch (Exception e) {
			throw new RuntimeException("Failed to get PostgreSQL options", e);
		}
		return options;
	}


	// ==================== 数据库 / Schema / 表 ====================
	private List<Map<String, Object>> listDatabases(String connId, DbExecutor exec) {
		String sql = """
                SELECT datname AS name
                FROM pg_database
                WHERE datistemplate = false AND datallowconn = true
                ORDER BY datname
                """;
		List<Map<String, Object>> rows = exec.queryMapForList(sql);
		rows.forEach(r -> {
			String db = (String) r.get("name");
			r.put("id", connId + "::database/" + db + "/");
			r.put("name", db);
		});
		return rows;
	}

	private List<Map<String, Object>> listSchemas(String connId, DbExecutor exec, String[] segs) {
		if (segs.length == 0) return List.of();
		String database = segs[0];

		String sql = """
                SELECT nspname AS name
                FROM pg_namespace
                WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
                ORDER BY nspname
                """;
		List<Map<String, Object>> rows = exec.queryMapForList(sql);
		rows.forEach(r -> {
			String schema = (String) r.get("name");
			r.put("id", connId + "::schema/" + database + "/" + schema + "/");
			r.put("name", schema);
		});
		return rows;
	}

	private List<Map<String, Object>> listTables(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 2) return List.of();
		String database = segs[0];
		String schema = segs[1];

		String sql = """
                SELECT tablename AS name
                FROM pg_tables
                WHERE schemaname = ? AND tablename NOT LIKE 'pg_%'
                ORDER BY tablename
                """;
		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema);
		rows.forEach(r -> {
			String table = (String) r.get("name");
			r.put("id", connId + "::table/" + database + "/" + schema + "/" + table + "/");
			r.put("name", table);
		});
		return rows;
	}

	private List<Map<String, Object>> listColumns(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 3) return List.of();
		String database = segs[0];
		String schema = segs[1];
		String table = segs[2];

		String sql = """
                SELECT column_name AS name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = ? AND table_name = ?
                ORDER BY ordinal_position
                """;
		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema, table);
		rows.forEach(r -> {
			String col = (String) r.get("name");
			r.put("id", connId + "::column/" + database + "/" + schema + "/" + table + "/" + col);
			r.put("name", col + " (" + r.get("data_type") + ")");
		});
		return rows;
	}

	// ==================== 约束 / 索引 ====================

	private List<Map<String, Object>> listConstraints(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 3) return List.of();
		String database = segs[0];
		String schema = segs[1];
		String table = segs[2];

		String sql = """
                SELECT
                    con.conname AS name,
                    CASE con.contype
                        WHEN 'p' THEN 'PRIMARY KEY'
                        WHEN 'u' THEN 'UNIQUE'
                        WHEN 'f' THEN 'FOREIGN KEY'
                        WHEN 'c' THEN 'CHECK'
                        WHEN 'x' THEN 'EXCLUSION'
                    END AS constraint_type,
                    pg_get_constraintdef(con.oid, true) AS definition
                FROM pg_constraint con
                INNER JOIN pg_class rel ON rel.oid = con.conrelid
                INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                WHERE nsp.nspname = ?
                  AND rel.relname = ?
                  AND con.contype IN ('p', 'u', 'f', 'c', 'x')
                ORDER BY con.conname
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema, table);
		rows.forEach(r -> {
			String constraintName = (String) r.get("name");
			String constraintType = (String) r.get("constraint_type");
			r.put("id", connId + "::constraint/" + database + "/" + schema + "/" + table + "/" + constraintName);
			r.put("name", constraintName + " [" + constraintType + "]");
		});
		return rows;
	}

	private List<Map<String, Object>> listIndexes(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 3) return List.of();
		String database = segs[0];
		String schema = segs[1];
		String table = segs[2];

		String sql = """
                SELECT
                    indexname AS name,
                    indexdef
                FROM pg_indexes
                WHERE schemaname = ?
                  AND tablename = ?
                ORDER BY indexname
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema, table);
		rows.forEach(r -> {
			String indexName = (String) r.get("name");
			r.put("id", connId + "::index/" + database + "/" + schema + "/" + table + "/" + indexName);
			r.put("name", indexName);
		});
		return rows;
	}

	// ==================== 视图 / 物化视图 / 序列 ====================

	/** 列出某个 schema 下的普通视图 */
	private List<Map<String, Object>> listViews(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 2) return List.of();
		String database = segs[0];
		String schema = segs[1];

		String sql = """
                SELECT viewname AS name
                FROM pg_views
                WHERE schemaname = ?
                ORDER BY viewname
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema);
		rows.forEach(r -> {
			String view = (String) r.get("name");
			r.put("id", connId + "::view/" + database + "/" + schema + "/" + view + "/");
			r.put("name", view);
		});
		return rows;
	}

	/** 列出某个 schema 下的物化视图 */
	private List<Map<String, Object>> listMaterializedViews(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 2) return List.of();
		String database = segs[0];
		String schema = segs[1];

		String sql = """
                SELECT matviewname AS name
                FROM pg_matviews
                WHERE schemaname = ?
                ORDER BY matviewname
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema);
		rows.forEach(r -> {
			String mv = (String) r.get("name");
			r.put("id", connId + "::matview/" + database + "/" + schema + "/" + mv + "/");
			r.put("name", mv);
		});
		return rows;
	}

	/** 列出某个 schema 下的序列 */
	private List<Map<String, Object>> listSequences(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 2) return List.of();
		String database = segs[0];
		String schema = segs[1];

		String sql = """
                SELECT sequence_name AS name
                FROM information_schema.sequences
                WHERE sequence_schema = ?
                ORDER BY sequence_name
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema);
		rows.forEach(r -> {
			String seq = (String) r.get("name");
			r.put("id", connId + "::sequence/" + database + "/" + schema + "/" + seq + "/");
			r.put("name", seq);
		});
		return rows;
	}

	// ==================== 函数 / 存储过程 ====================

	/** 列出某个 schema 下的函数（prokind = 'f'） */
	private List<Map<String, Object>> listFunctions(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 2) return List.of();
		String database = segs[0];
		String schema = segs[1];

		String sql = """
                SELECT
                    p.oid,
                    p.proname AS name,
                    pg_get_function_arguments(p.oid) AS args,
                    pg_get_function_result(p.oid) AS result_type
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = ?
                  AND p.prokind = 'f'
                ORDER BY p.proname, args
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema);
		rows.forEach(r -> {
			String funcName = (String) r.get("name");
			String args = (String) r.get("args");          // 可能为空字符串
			String resultType = (String) r.get("result_type");

			String signature = funcName + "(" + (args == null ? "" : args) + ")";
			r.put("id", connId + "::function/" + database + "/" + schema + "/" + signature);

			String display = signature + " → " + resultType;
			r.put("name", display);
		});
		return rows;
	}

	/** 列出某个 schema 下的存储过程（prokind = 'p'） */
	private List<Map<String, Object>> listProcedures(String connId, DbExecutor exec, String[] segs) {
		if (segs.length < 2) return List.of();
		String database = segs[0];
		String schema = segs[1];

		String sql = """
                SELECT
                    p.oid,
                    p.proname AS name,
                    pg_get_function_arguments(p.oid) AS args
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = ?
                  AND p.prokind = 'p'
                ORDER BY p.proname, args
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql, schema);
		rows.forEach(r -> {
			String procName = (String) r.get("name");
			String args = (String) r.get("args");

			String signature = procName + "(" + (args == null ? "" : args) + ")";
			r.put("id", connId + "::procedure/" + database + "/" + schema + "/" + signature);
			r.put("name", signature);
		});
		return rows;
	}

	// ==================== 角色：Login / Group / System ====================

	/**
	 * Login Roles：可登录账号
	 * 规则：rolcanlogin = true AND rolname NOT LIKE 'pg_%'
	 */
	private List<Map<String, Object>> listLoginRoles(String connId, DbExecutor exec) {
		String sql = """
                SELECT
                    r.oid,
                    r.rolname AS name,
                    r.rolcanlogin,
                    r.rolsuper,
                    r.rolinherit,
                    r.rolcreatedb,
                    r.rolcreaterole,
                    r.rolreplication,
                    r.rolbypassrls,
                    CASE
                        WHEN r.rolvaliduntil IS NULL THEN 'infinity'
                        ELSE to_char(r.rolvaliduntil, 'YYYY-MM-DD HH24:MI:SS')
                    END AS valid_until,
                    d.description AS comment
                FROM pg_roles r
                LEFT JOIN pg_shdescription d
                  ON d.objoid = r.oid
                 AND d.classoid = 'pg_authid'::regclass
                WHERE r.rolcanlogin = true
                  AND r.rolname NOT LIKE 'pg\\_%'
                ORDER BY r.rolname
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql);
		rows.forEach(r -> {
			String roleName = (String) r.get("name");
			r.put("id", connId + "::role/login/" + roleName);
			r.put("type", "login"); // 给前端一个类别标签，备用
		});
		return rows;
	}

	/**
	 * Group Roles：权限组 / 角色组
	 * 规则：rolcanlogin = false AND rolname NOT LIKE 'pg_%'
	 */
	private List<Map<String, Object>> listGroupRoles(String connId, DbExecutor exec) {
		String sql = """
                SELECT
                    r.oid,
                    r.rolname AS name,
                    r.rolcanlogin,
                    r.rolsuper,
                    r.rolinherit,
                    r.rolcreatedb,
                    r.rolcreaterole,
                    r.rolreplication,
                    r.rolbypassrls,
                    CASE
                        WHEN r.rolvaliduntil IS NULL THEN 'infinity'
                        ELSE to_char(r.rolvaliduntil, 'YYYY-MM-DD HH24:MI:SS')
                    END AS valid_until,
                    d.description AS comment
                FROM pg_roles r
                LEFT JOIN pg_shdescription d
                  ON d.objoid = r.oid
                 AND d.classoid = 'pg_authid'::regclass
                WHERE r.rolcanlogin = false
                  AND r.rolname NOT LIKE 'pg\\_%'
                ORDER BY r.rolname
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql);
		rows.forEach(r -> {
			String roleName = (String) r.get("name");
			r.put("id", connId + "::role/group/" + roleName);
			r.put("type", "group");
		});
		return rows;
	}

	/**
	 * System Roles：系统内置角色
	 * 规则：rolname LIKE 'pg_%'
	 */
	private List<Map<String, Object>> listSystemRoles(String connId, DbExecutor exec) {
		String sql = """
                SELECT
                    r.oid,
                    r.rolname AS name,
                    r.rolcanlogin,
                    r.rolsuper,
                    r.rolinherit,
                    r.rolcreatedb,
                    r.rolcreaterole,
                    r.rolreplication,
                    r.rolbypassrls,
                    CASE
                        WHEN r.rolvaliduntil IS NULL THEN 'infinity'
                        ELSE to_char(r.rolvaliduntil, 'YYYY-MM-DD HH24:MI:SS')
                    END AS valid_until,
                    d.description AS comment
                FROM pg_roles r
                LEFT JOIN pg_shdescription d
                  ON d.objoid = r.oid
                 AND d.classoid = 'pg_authid'::regclass
                WHERE r.rolname LIKE 'pg\\_%'
                ORDER BY r.rolname
                """;

		List<Map<String, Object>> rows = exec.queryMapForList(sql);
		rows.forEach(r -> {
			String roleName = (String) r.get("name");
			r.put("id", connId + "::role/system/" + roleName);
			r.put("type", "system");
		});
		return rows;
	}
}
