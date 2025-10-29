// src/main/java/com/deego/controller/ActionController.java

package com.deego.controller;

import com.deego.common.ApiResponse;
import com.deego.service.ActionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/db")
@Slf4j
public class ActionController {

	@Autowired
	private ActionService actionService;

	/**
	 * 执行数据库动作
	 * POST /db/defaultAction
	 * Body: { "nodeId": "xxx", "connectionId": "1", "schemaName": "...", ... }
	 */
	@PostMapping("/{handler}")
	public ApiResponse<String> executeAction(
			@PathVariable String handler,
			@RequestBody Map<String, Object> params) {

		try {
			// 确保 connectionId 在 params 中（ActionService 需要）
			String result = actionService.executeAction(handler, params);
			return ApiResponse.ok(result);
		} catch (Exception e) {
			log.error("Action error: ", e);
			return ApiResponse.error("ACTION_ERROR", "动作执行失败: " + e.getMessage());
		}
	}
}