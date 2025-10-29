package com.deego.service;

import com.deego.exception.BizException;
import com.deego.model.Connection;
import com.deego.repository.ConnectionRepository;
import com.deego.utils.IdWorker;
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

	private final Map<String, HikariDataSource> dataSources = new HashMap<>();

	public List<Connection> getAllConnections() {
		return connectionRepository.findAll();
	}

	public Connection createConnection(Connection conn) {
		if (conn.getId() == null || conn.getId().isEmpty()) {
			conn.setId(IdWorker.getIdStr());
		}
		Connection saved = connectionRepository.save(conn);
		createDataSource(saved);
		return saved;
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
			HikariDataSource ds = createTempDataSource(conn);
			new JdbcTemplate(ds).queryForObject("SELECT 1", Integer.class);
			ds.close();
			return "Connected successfully!";
		} catch (Exception e) {
			throw new BizException("Connection failed: " + e.getMessage());
		}
	}

	public JdbcTemplate getJdbcTemplate(String id) {
		HikariDataSource ds = dataSources.get(id);
		if (ds == null) {
			Optional<Connection> connOpt = getConnection(id);
			if (connOpt.isPresent()) {
				ds = createDataSource(connOpt.get());
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

	private void closeDataSource(String id) {
		HikariDataSource ds = dataSources.remove(id);
		if (ds != null) {
			ds.close();
		}
	}
}