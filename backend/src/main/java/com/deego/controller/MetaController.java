package com.deego.controller;

import com.deego.service.TreeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meta")
public class MetaController {
	@Autowired
	private TreeService treeService;

	@GetMapping("/{connId}/{path}/children")
	public ResponseEntity<Map<String, List<Map<String, Object>>>> loadChildren(@PathVariable String connId, @PathVariable String path) {
		List<Map<String, Object>> children = treeService.loadChildren(connId, path);
		Map<String, List<Map<String, Object>>> response = Map.of("data", children);
		return ResponseEntity.ok(response);
	}
}