package com.deego.controller;

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

	@GetMapping(value = {"/{connId}/children", "/{connId}/{path}/children"})
	public List<Map<String,Object>> loadChildren(
			@PathVariable String connId,
			@PathVariable(required = false) String path) {
		return treeService.loadChildren(connId, path);
	}
}