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
	@GetMapping("/{connId}/children/{nodeType}/{path:.+}")
	public ApiResponse<List<Map<String, Object>>> children(
			@PathVariable String connId,
			@PathVariable DatabaseNodeType nodeType,
			@PathVariable String path) {

		// Spring 会自动 trim 末尾的 /，我们统一加回来便于处理
		if (!path.endsWith("/")) {
			path = path + "/";
		}

		return ApiResponse.ok(metaService.listChildren(connId, nodeType, path));
	}

	// 根节点快捷入口（可选）
	@GetMapping("/{connId}/children/root")
	public ApiResponse<List<Map<String, Object>>> root(@PathVariable String connId) {
		return ApiResponse.ok(metaService.listChildren(connId, DatabaseNodeType.ROOT, ""));
	}
}