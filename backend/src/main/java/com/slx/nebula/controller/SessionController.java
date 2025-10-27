package com.slx.nebula.controller;

import com.slx.nebula.enums.DbTypeEnum;
import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.repository.ConfigRepository;
import org.springframework.web.bind.annotation.*;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/session")
public class SessionController {
	private final ConfigRepository repo;

	public SessionController(ConfigRepository repo) {
		this.repo = repo;
	}

	private Connection open(ConnectionConfig cfg) throws SQLException {
		String url;
		if (cfg.dbType == DbTypeEnum.POSTGRESQL) {
			String db = (cfg.database == null || cfg.database.isBlank()) ? "postgres" : cfg.database;
			url = "jdbc:postgresql://" + cfg.host + ":" + cfg.port + "/" + db;
		} else if (cfg.dbType == DbTypeEnum.MYSQL) {
			String db = (cfg.database == null || cfg.database.isBlank()) ? "" : ("/" + cfg.database);
			url = "jdbc:mysql://" + cfg.host + ":" + cfg.port + db + "?useSSL=false&serverTimezone=UTC";
		} else
			throw new RuntimeException("Unsupported db type");
		return DriverManager.getConnection(url, cfg.username, cfg.password);
	}

	@PostMapping("/create")
	public Map<String, String> create(@RequestBody CreateReq req) {
		return Map.of("editorId", req.editorId, "connectionId", req.connectionId);
	}

	@PostMapping("/{editorId}/query")
	public Map<String, Object> query(@PathVariable String editorId, @RequestParam String connectionId, @RequestBody QueryReq req) throws Exception {
		ConnectionConfig cfg = repo.getConnection(connectionId);
		if (cfg == null)
			throw new RuntimeException("connection not found");
		try (Connection c = open(cfg)) {
			String sql = (req.sql == null || req.sql.isBlank()) ? "SELECT 1" : req.sql;
			try (Statement st = c.createStatement()) {
				boolean hasRs = st.execute(sql);
				if (hasRs) {
					try (ResultSet rs = st.getResultSet()) {
						List<String> columns = new ArrayList<>();
						List<List<Object>> rows = new ArrayList<>();
						int cnt = rs.getMetaData().getColumnCount();
						for (int i = 1; i <= cnt; i++)
							columns.add(rs.getMetaData().getColumnLabel(i));
						while (rs.next()) {
							List<Object> row = new ArrayList<>();
							for (int i = 1; i <= cnt; i++)
								row.add(rs.getObject(i));
							rows.add(row);
						}
						return Map.of("columns", columns, "rows", rows);
					}
				} else {
					int update = st.getUpdateCount();
					return Map.of("updateCount", update);
				}
			}
		}
	}

	@PostMapping("/{editorId}/close")
	public Map<String, String> close(@PathVariable String editorId) {
		return Map.of("editorId", editorId, "status", "closed");
	}

	public static class CreateReq {
		public String editorId;
		public String connectionId;
	}

	public static class QueryReq {
		public String sql;
	}
}