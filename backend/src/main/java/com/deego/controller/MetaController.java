package com.deego.controller;

import com.deego.common.ApiResponse;
import com.deego.service.TreeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/meta")
public class MetaController {
	@Autowired
	private TreeService treeService;

	@GetMapping("/{connId}/children")
	public ApiResponse<List<Map<String, Object>>> top(@PathVariable String connId) {
		var rs = treeService.loadChildren(connId, null);
		return ApiResponse.ok(rs);
	}

	// 单段：/api/meta/{connId}/{nodeKey}/children   和   /meta/{connId}/{nodeKey}/children
	@GetMapping("/{connId}/{nodeKey}/children")
	public ApiResponse<List<Map<String, Object>>> children1(
			@PathVariable String connId,
			@PathVariable String nodeKey
	) {
		var rs = treeService.loadChildren(connId, nodeKey);
		return ApiResponse.ok(rs);
	}

	// 双段：/api/meta/{connId}/{nodeKey}/{entityId}/children   和   /meta/{connId}/{nodeKey}/{entityId}/children
	@GetMapping("/{connId}/{nodeKey}/{entityId}/children")
	public ApiResponse<List<Map<String, Object>>> children2(
			@PathVariable String connId,
			@PathVariable String nodeKey,
			@PathVariable String entityId
	) {
		var rs = treeService.loadChildren(connId, nodeKey + "/" + entityId);
		return ApiResponse.ok(rs);
	}
}