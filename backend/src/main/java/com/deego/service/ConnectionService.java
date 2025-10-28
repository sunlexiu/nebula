package com.deego.service;

import com.deego.model.Connection;
import com.deego.repository.ConnectionRepository;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ConnectionService {
	@Autowired
	private ConnectionRepository connectionRepository;

	private final Map<Long, HikariDataSource> dataSources = new HashMap<>(); // 连接池缓存

	public List<Connection> getAllConnections() {
		return connectionRepository.findAll();
	}

	public Connection createConnection(Connection conn) {
		Connection saved = connectionRepository.save(conn);
		createDataSource(saved); // 预创建池
		return saved;
	}

	public Optional<Connection> getConnection(Long id) {
		return connectionRepository.findById(id);
	}

	public Connection updateConnection(Long id, Connection update) {
		Optional<Connection> existing = getConnection(id);
		if (existing.isPresent()) {
			Connection conn = existing.get();
			conn.setName(update.getName());
			conn.setHost(update.getHost());
			conn.setPort(update.getPort());
			conn.setDatabase(update.getDatabase());
			conn.setUsername(update.getUsername());
			conn.setPassword(update.getPassword()); // 生产加密
			Connection saved = connectionRepository.save(conn);
			closeDataSource(id); // 关闭旧池
			createDataSource(saved); // 新池
			return saved;
		}
		return null;
	}

	public void deleteConnection(Long id) {
		closeDataSource(id);
		connectionRepository.deleteById(id);
	}

	public String testConnection(Connection conn) {
		try {
			HikariDataSource ds = createTempDataSource(conn);
			new JdbcTemplate(ds).queryForObject("SELECT 1", Integer.class);
			ds.close();
			return "Connected successfully!";
		} catch (Exception e) {
			return "Connection failed: " + e.getMessage();
		}
	}

	public JdbcTemplate getJdbcTemplate(Long connId) {
		HikariDataSource ds = dataSources.get(connId);
		if (ds == null) {
			Optional<Connection> connOpt = getConnection(connId);
			if (connOpt.isPresent()) {
				Connection conn = connOpt.get();
				ds = createDataSource(conn);
			}
		}
		return new JdbcTemplate(ds);
	}

	private HikariDataSource createDataSource(Connection conn) {
		HikariConfig config = new HikariConfig();
		config.setJdbcUrl("jdbc:postgresql://" + conn.getHost() + ":" + conn.getPort() + "/" + conn.getDatabase());
		config.setUsername(conn.getUsername());
		config.setPassword(conn.getPassword());
		config.setDriverClassName("org.postgresql.Driver");
		HikariDataSource ds = new HikariDataSource(config);
		dataSources.put(conn.getId(), ds);
		return ds;
	}

	private HikariDataSource createTempDataSource(Connection conn) {
		HikariConfig config = new HikariConfig();
		config.setJdbcUrl("jdbc:postgresql://" + conn.getHost() + ":" + conn.getPort() + "/" + conn.getDatabase());
		config.setUsername(conn.getUsername());
		config.setPassword(conn.getPassword());
		config.setDriverClassName("org.postgresql.Driver");
		return new HikariDataSource(config);
	}

	private void closeDataSource(Long connId) {
		HikariDataSource ds = dataSources.remove(connId);
		if (ds != null) {
			ds.close();
		}
	}
}