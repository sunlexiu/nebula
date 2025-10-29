package com.deego.controller;

import com.deego.service.ConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/query")
public class QueryController {

	@Autowired
	private ConnectionService connectionService;

	/**
	 * /api/query/execute (POST): 执行 SQL 查询，返回结果。
	 * body: {connId: 1, query: "SELECT * FROM users LIMIT 1000"}
	 * 返回: {success: true, results: [...], rowCount: 10}
	 */
	@PostMapping("/execute")
	public ResponseEntity<Map<String, Object>> executeQuery(@RequestBody Map<String, Object> request) {
		String connId = (String) request.get("connId");
		String query = (String) request.get("query");

		try {
			JdbcTemplate jdbc = connectionService.getJdbcTemplate(connId);
			// 执行查询（假设 SELECT；生产加类型检查，避免 DDL）
			List<Map<String, Object>> results = jdbc.queryForList(query);
			Map<String, Object> response = Map.of(
					"success", true,
					"results", results,
					"rowCount", results.size()
			);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			Map<String, Object> error = Map.of(
					"success", false,
					"error", e.getMessage()
			);
			return ResponseEntity.badRequest().body(error);
		}
	}
}