package com.deego.service;

import com.deego.enums.DatabaseType;
import com.deego.exception.BizException;
import com.deego.model.Connection;
import com.deego.service.action.DatabaseActionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ActionService {

	@Autowired
	private ConnectionService connectionService;

	/**
	 * 按 DatabaseType 存放不同实现，例如：
	 *  POSTGRESQL -> PostgreSqlActionService
	 *  MYSQL      -> MySqlActionService（未来扩展）
	 */
	private final Map<DatabaseType, DatabaseActionService> delegateMap = new EnumMap<>(DatabaseType.class);

	/**
	 * 通过构造器把所有 DatabaseActionService 注入进来
	 */
	@Autowired
	public ActionService(List<DatabaseActionService> delegates) {
		if (delegates != null) {
			for (DatabaseActionService service : delegates) {
				delegateMap.put(service.dbType(), service);
			}
		}
	}

	/**
	 * /api/db/{handler}
	 * body 中需要至少包含 connectionId
	 */
	public String executeAction(String handler, Map<String, Object> params) {
		Object connIdObj = params.get("connectionId");
		if (connIdObj == null) {
			throw new BizException("connectionId is required");
		}
		String connId = connIdObj.toString();

		// 1. 找到连接及 dbType
		Connection conn = connectionService.getConnection(connId)
										   .orElseThrow(() -> new BizException("Connection not found: " + connId));

		DatabaseType type = DatabaseType.fromValue(conn.getDbType());

		// 2. 找到对应的 DatabaseActionService
		DatabaseActionService delegate = delegateMap.get(type);
		if (delegate == null) {
			throw new BizException("Unsupported dbType for actions: " + type);
		}

		// 3. 拿到对应数据库的 JdbcTemplate（你已有的通用方法）
		JdbcTemplate jdbc = connectionService.getJdbcTemplate(connId);

		// 4. 委派给具体数据库实现
		return delegate.execute(handler, jdbc, params);
	}
}
