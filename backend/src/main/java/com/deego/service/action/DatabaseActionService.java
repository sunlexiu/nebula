package com.deego.service.action;

import com.deego.enums.DatabaseType;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

/**
 * 不同数据库类型的 ActionService 实现接口。
 * 一种数据库一个实现，例如 PostgreSqlActionService / MySqlActionService 等。
 */
public interface DatabaseActionService {

	/**
	 * 该实现对应的数据库类型
	 */
	DatabaseType dbType();

	/**
	 * 执行具体 handler
	 *
	 * @param handler handler 名称，例如 "createNewSchema"
	 * @param jdbc    已经路由到对应数据库实例的 JdbcTemplate
	 * @param params  请求参数，包含 connectionId、schemaName 等
	 * @return 处理结果信息（简单字符串，方便前端提示）
	 */
	String execute(String handler, JdbcTemplate jdbc, Map<String, Object> params);
}
