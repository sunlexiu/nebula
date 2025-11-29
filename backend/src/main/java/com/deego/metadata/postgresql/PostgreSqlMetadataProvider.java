package com.deego.metadata.postgresql;

import com.deego.enums.DatabaseType;
import com.deego.exec.DbExecutor;
import com.deego.metadata.DatabaseNodeType;
import com.deego.metadata.MetadataProvider;
import com.deego.model.Connection;
import com.deego.service.ConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

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
		DbExecutor executor = connectionService.getExecutor(connId, pathSegments[0]);

		return switch (nodeType) {
			case DATABASE -> listDatabases(connId, executor);
			case SCHEMA -> listSchemas(connId, executor, pathSegments);
			case TABLE -> listTables(connId, executor, pathSegments);
			case COLUMN -> listColumns(connId, executor, pathSegments);
			default -> List.of();
		};
	}

	private List<Map<String, Object>> listDatabases(String connId, DbExecutor exec) {
		String sql = """
                SELECT datname AS name
                FROM pg_database
                WHERE datistemplate = false AND datallowconn = true
                ORDER BY datname
                """;
		List<Map<String, Object>> rows = exec.queryForList(sql);
		rows.forEach(r -> {
			String db = (String) r.get("name");
			r.put("id", connId + "::database/" + db + "/");
			r.put("name", db);
			r.put("type", DatabaseNodeType.DATABASE.name().toLowerCase());
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
		List<Map<String, Object>> rows = exec.queryForList(sql);
		rows.forEach(r -> {
			String schema = (String) r.get("name");
			r.put("id", connId + "::schema/" + database + "/" + schema + "/");
			r.put("name", schema);
			r.put("type", "SCHEMA");
			r.put("hasChildren", true);
			r.put("children", List.of());
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
		List<Map<String, Object>> rows = exec.queryForList(sql, schema);
		rows.forEach(r -> {
			String table = (String) r.get("name");
			r.put("id", connId + "::table/" + database + "/" + schema + "/" + table + "/");
			r.put("name", table);
			r.put("type", "TABLE");
			r.put("hasChildren", true);
			r.put("children", List.of());
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
		List<Map<String, Object>> rows = exec.queryForList(sql, schema, table);
		rows.forEach(r -> {
			String col = (String) r.get("name");
			r.put("id", connId + "::column/" + database + "/" + schema + "/" + table + "/" + col);
			r.put("name", col + " (" + r.get("data_type") + ")");
			r.put("type", "COLUMN");
			r.put("hasChildren", false);
			r.put("children", List.of());
		});
		return rows;
	}
}