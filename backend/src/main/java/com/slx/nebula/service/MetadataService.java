package com.slx.nebula.service;

import com.slx.nebula.common.ErrorCode;
import com.slx.nebula.connection.DatabaseProvider;
import com.slx.nebula.connection.DatabaseProviderRegistry;
import com.slx.nebula.enums.DbTypeEnum;
import com.slx.nebula.exception.BizException;
import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.repository.ConfigRepository;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MetadataService {

	private final ConfigRepository repo;
	private final DatabaseProviderRegistry registry;

	public MetadataService(ConfigRepository repo, DatabaseProviderRegistry registry) {
		this.repo = repo;
		this.registry = registry;
	}

	// --------- 公共工具 ---------
	private ConnectionConfig withDb(ConnectionConfig src, String dbOverride) {
		ConnectionConfig c = new ConnectionConfig();
		c.setId(src.getId());
		c.setName(src.getName());
		c.setDbType(src.getDbType());
		c.setHost(src.getHost());
		c.setPort(src.getPort());
		c.setUsername(src.getUsername());
		c.setPassword(src.getPassword());
		c.setDatabase((dbOverride == null || dbOverride.isBlank()) ? src.getDatabase() : dbOverride);
		return c;
	}

	private Connection getConn(String connId, String dbOverride) throws SQLException {
		ConnectionConfig cfg = repo.findConnectionById(connId)
								   .orElseThrow(() -> new BizException(ErrorCode.NOT_FOUND, "连接不存在: " + connId));
		DatabaseProvider provider = registry.getProvider(cfg.getDbType());
		if (provider == null) throw new BizException(ErrorCode.BUSINESS_ERROR, "不支持的数据库类型: " + cfg.getDbType());
		DataSource ds = provider.createDataSource(withDb(cfg, dbOverride));
		return ds.getConnection();
	}

	// --------- 对外方法 ---------

	public List<String> listDatabases(String connId) {
		try (Connection c = getConn(connId, "postgres");
				PreparedStatement ps = c.prepareStatement("""
                 select datname
                 from pg_database
                 where datallowconn and not datistemplate
                 order by 1
             """); ResultSet rs = ps.executeQuery()) {
			List<String> out = new ArrayList<>();
			while (rs.next()) out.add(rs.getString(1));
			return out;
		} catch (SQLException e) {
			throw new BizException(ErrorCode.BUSINESS_ERROR, "获取数据库列表失败: " + e.getMessage());
		}
	}

	public List<String> listSchemas(String connId, String db) {
		try (Connection c = getConn(connId, db);
				PreparedStatement ps = c.prepareStatement("""
                 select nspname
                 from pg_namespace
                 where nspname not like 'pg_%' and nspname <> 'information_schema'
                 order by 1
             """); ResultSet rs = ps.executeQuery()) {
			List<String> out = new ArrayList<>();
			while (rs.next()) out.add(rs.getString(1));
			return out;
		} catch (SQLException e) {
			throw new BizException(ErrorCode.BUSINESS_ERROR, "获取 Schema 失败: " + e.getMessage());
		}
	}

	public Map<String, Object> listObjects(String connId, String db, String schema, String types) {
		Set<String> need = Arrays.stream(types.split(","))
								 .map(s -> s.trim().toLowerCase()).filter(s -> !s.isEmpty()).collect(Collectors.toSet());

		Map<String, Object> out = new LinkedHashMap<>();
		try (Connection c = getConn(connId, db)) {
			if (need.contains("tables")) {
				try (PreparedStatement ps = c.prepareStatement("""
                        select table_name
                        from information_schema.tables
                        where table_schema = ? and table_type = 'BASE TABLE'
                        order by 1
                    """)) {
					ps.setString(1, schema);
					try (ResultSet rs = ps.executeQuery()) {
						List<String> items = new ArrayList<>();
						while (rs.next()) items.add(rs.getString(1));
						out.put("tables", items);
					}
				}
			}
			if (need.contains("views")) {
				try (PreparedStatement ps = c.prepareStatement("""
                        select table_name
                        from information_schema.tables
                        where table_schema = ? and table_type = 'VIEW'
                        order by 1
                    """)) {
					ps.setString(1, schema);
					try (ResultSet rs = ps.executeQuery()) {
						List<String> items = new ArrayList<>();
						while (rs.next()) items.add(rs.getString(1));
						out.put("views", items);
					}
				}
			}
			if (need.contains("functions")) {
				try (PreparedStatement ps = c.prepareStatement("""
                        select p.proname as name,
                               pg_get_function_identity_arguments(p.oid) as args
                        from pg_proc p
                        join pg_namespace n on n.oid = p.pronamespace
                        where n.nspname = ?
                        order by 1,2
                    """)) {
					ps.setString(1, schema);
					try (ResultSet rs = ps.executeQuery()) {
						List<Map<String, String>> fns = new ArrayList<>();
						while (rs.next()) {
							fns.add(Map.of("name", rs.getString("name"),
									"args", rs.getString("args")));
						}
						out.put("functions", fns);
					}
				}
			}
			return out;
		} catch (SQLException e) {
			throw new BizException(ErrorCode.BUSINESS_ERROR, "获取对象失败: " + e.getMessage());
		}
	}
}
