package com.slx.nebula.controller;

import com.slx.nebula.common.ApiResponse;
import com.slx.nebula.service.MetadataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/meta")
public class MetaController {

	private final MetadataService svc;

	public MetaController(MetadataService svc) {
		this.svc = svc;
	}

	/** 列出数据库 */
	@GetMapping("/{connId}/databases")
	public ApiResponse<Map<String, Object>> databases(@PathVariable String connId) {
		List<String> items = svc.listDatabases(connId);
		return ApiResponse.success(Map.of("items", items));
	}

	/** 列出某数据库下的 schemas */
	@GetMapping("/{connId}/databases/{db}/schemas")
	public ApiResponse<Map<String, Object>> schemas(@PathVariable String connId, @PathVariable String db) {
		List<String> items = svc.listSchemas(connId, db);
		return ApiResponse.success(Map.of("items", items));
	}

	/** 列出 schema 下对象（表/视图/函数），types 逗号分隔：tables,views,functions */
	@GetMapping("/{connId}/databases/{db}/schemas/{schema}/objects")
	public ApiResponse<Map<String, Object>> objects(
			@PathVariable String connId,
			@PathVariable String db,
			@PathVariable String schema,
			@RequestParam(defaultValue = "tables,views,functions") String types
	) {
		return ApiResponse.success(svc.listObjects(connId, db, schema, types));
	}
}
