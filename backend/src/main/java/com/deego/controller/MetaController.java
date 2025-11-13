package com.deego.controller;

import com.deego.common.ApiResponse;
import com.deego.service.MetaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meta")
public class MetaController {

	@Autowired
	private MetaService metaService;

	/* 真实节点列表：顶层 */
	@GetMapping("/{connId}/children")
	public ApiResponse<List<Map<String, Object>>> top(@PathVariable String connId) {
		return ApiResponse.ok(metaService.listDatabases(connId));
	}

	/* 真实节点列表：单段路径 */
	@GetMapping("/{connId}/{nodeKey}/children")
	public ApiResponse<List<Map<String, Object>>> children(
			@PathVariable String connId,
			@PathVariable String nodeKey) {
		return ApiResponse.ok(metaService.listChildren(connId, nodeKey));
	}

	/* 真实节点列表：双段路径 */
	@GetMapping("/{connId}/{nodeKey}/{entityId}/children")
	public ApiResponse<List<Map<String, Object>>> children(
			@PathVariable String connId,
			@PathVariable String nodeKey,
			@PathVariable String entityId) {
		return ApiResponse.ok(metaService.listChildren(connId, nodeKey + "/" + entityId));
	}
}