package com.deego.controller;

import com.deego.common.ApiResponse;
import com.deego.metadata.DatabaseNodeType;
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

	/**
	 * 统一左侧树展开接口
	 * 示例：
	 * /api/meta/1/children/database/
	 * /api/meta/1/children/schema/mydb/
	 * /api/meta/1/children/table/mydb/public/
	 */
	@GetMapping({"/{connId}/children/{type}", "/{connId}/children/{type}/{path:.+}"})
	public ApiResponse<List<Map<String, Object>>> children(
			@PathVariable String connId,
			@PathVariable String type,
			@PathVariable(required = false) String path) {
		DatabaseNodeType nodeType = DatabaseNodeType.valueOf(type.toUpperCase());
		return ApiResponse.ok(metaService.listChildren(connId, nodeType, path));
	}
}