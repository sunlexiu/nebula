package com.deego.service;

import com.deego.exception.BizException;
import com.deego.exec.DbExecutor;
import com.deego.manager.ConnectionManager;
import com.deego.model.Connection;
import com.deego.repository.ConnectionRepository;
import com.deego.utils.IdWorker;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import java.util.*;

@Service
public class ConnectionService {
	@Autowired
	private ConnectionManager connectionManager;
	@Autowired
	private ConnectionRepository connectionRepository;

	private final Map<String, HikariDataSource> dataSources = new HashMap<>();

	public List<Connection> getAllConnections() {
		return connectionRepository.findAll();
	}

	public DbExecutor getExecutor(String connId) {
		Connection c = getConnection(connId).orElseThrow(() -> new BizException("Connection not found: " + connId));
		return connectionManager.acquireExecutor(c, c.getDatabase());
	}

	public DbExecutor getExecutor(String connId, String database) {
		Connection c = getConnection(connId).orElseThrow(() -> new BizException("Connection not found: " + connId));
		if (ObjectUtils.isEmpty(database)) {
			database = c.getDatabase();
		}
		return connectionManager.acquireExecutor(c, database);
	}

	/* 供 ConfigController 拉根节点 */
	public List<Connection> getRootConnections() {
		return connectionRepository.findByParentIdIsNull();
	}

	public Connection createConnection(Connection conn) {
		if (conn.getId() == null || conn.getId().isEmpty()) {
			conn.setId(IdWorker.getIdStr());
		}
		Connection saved = connectionRepository.save(conn);
		createDataSource(saved);
		return saved;
	}


	/**
	 * 主动断开某个连接的所有连接池：
	 * 1. 关闭 ConnectionService 自己维护的 dataSources
	 * 2. 通知 ConnectionManager 关闭该连接下所有数据库实例的池（connId@dbName）
	 * 3. 更新连接状态为未连接
	 */
	public void disconnectConnection(String id) {
		// 1) 关掉 ConnectionService 维护的 HikariDataSource
		closeDataSource(id);

		// 2) 关掉 ConnectionManager 中该连接下所有的池（可能已有多个 database）
		connectionManager.closeAllForConnection(id);

		// 3) 更新 connected 标记
		getConnection(id).ifPresent(conn -> {
			conn.setConnected(false);
			connectionRepository.save(conn);
		});
	}

	public Optional<Connection> getConnection(String id) {
		return connectionRepository.findById(id);
	}

	public Connection updateConnection(String id, Connection update) {
		Optional<Connection> existing = getConnection(id);
		if (existing.isPresent()) {
			Connection conn = existing.get();
			conn.setName(update.getName());
			conn.setHost(update.getHost());
			conn.setPort(update.getPort());
			conn.setDatabase(update.getDatabase());
			conn.setUsername(update.getUsername());
			conn.setPassword(update.getPassword());
			Connection saved = connectionRepository.save(conn);
			closeDataSource(id);
			createDataSource(saved);
			return saved;
		}
		return null;
	}

	public void deleteConnection(String id) {
		closeDataSource(id);
		connectionRepository.deleteById(id);
	}

	public String testConnection(Connection conn) {
		try {
			if (!StringUtils.hasText(conn.getPassword()) && StringUtils.hasText(conn.getId())) {
				Connection connection = connectionRepository.getReferenceById(conn.getId());
				if (Objects.isNull(conn.getId())) {
					throw new BizException("Connection failed");
				}
				conn.setPassword(connection.getPassword());
			}
			HikariDataSource ds = createTempDataSource(conn);
			new JdbcTemplate(ds).queryForObject("SELECT 1", Integer.class);
			ds.close();
			return "Connected successfully!";
		} catch (Exception e) {
			throw new BizException("Connection failed: " + e.getMessage());
		}
	}

	public JdbcTemplate getJdbcTemplate(String id) {
		com.deego.model.Connection c = getConnection(id)
				.orElseThrow(() -> new com.deego.exception.BizException("Connection not found: " + id));
		com.deego.exec.DbExecutor ex = connectionManager.acquireExecutor(c, null);
		if (ex instanceof com.deego.exec.JdbcExecutor j) return j.jdbc();
		throw new com.deego.exception.BizException("Not a relational executor for connection " + id);
	}

	private com.zaxxer.hikari.HikariDataSource createDataSource(com.deego.model.Connection conn) {
		com.zaxxer.hikari.HikariDataSource ds =
				connectionManager.createEphemeralJdbcDataSource(conn, conn.getDatabase());
		dataSources.put(conn.getId(), ds);   // 保持你现有的 map 语义不变
		return ds;
	}

	private com.zaxxer.hikari.HikariDataSource createTempDataSource(com.deego.model.Connection conn) {
		// 纯临时，不入缓存
		return connectionManager.createEphemeralJdbcDataSource(conn, conn.getDatabase());
	}


	private void closeDataSource(String id) {
		HikariDataSource ds = dataSources.remove(id);
		if (ds != null) {
			ds.close();
		}
	}

	public org.springframework.jdbc.core.JdbcTemplate getJdbcTemplate(String id, String overrideDb) {
		com.deego.model.Connection c = getConnection(id).orElseThrow(() -> new com.deego.exception.BizException("Connection not found: " + id));
		com.deego.exec.DbExecutor ex = connectionManager.acquireExecutor(c, overrideDb);
		if (ex instanceof com.deego.exec.JdbcExecutor j) return j.jdbc();
		throw new com.deego.exception.BizException("Not a relational executor for connection " + id);
	}

}
