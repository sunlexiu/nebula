package com.slx.nebula.controller;

import com.slx.nebula.tree.model.TreeNode;
import com.slx.nebula.tree.service.TreeService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/meta")
public class MetaController {
	private final TreeService treeService;

	public MetaController(TreeService treeService) {
		this.treeService = treeService;
	}

	@GetMapping("/{connId}/databases")
	public List<Map<String, String>> databases(@PathVariable String connId) {
		List<TreeNode> nodes = treeService.children(connId, "");
		List<Map<String, String>> out = new ArrayList<>();
		for (TreeNode n : nodes)
			if ("database".equalsIgnoreCase(n.type))
				out.add(Map.of("name", n.label));
		return out;
	}

	@GetMapping("/{connId}/databases/{db}/schemas")
	public List<Map<String, String>> schemas(@PathVariable String connId, @PathVariable("db") String db) {
		List<TreeNode> nodes = treeService.children(connId, "database=" + db);
		List<Map<String, String>> out = new ArrayList<>();
		for (TreeNode n : nodes)
			if ("schema".equalsIgnoreCase(n.type))
				out.add(Map.of("name", n.label));
		return out;
	}

	@GetMapping("/{connId}/databases/{db}/schemas/{schema}/objects")
	public Map<String, List<Map<String, String>>> objects(@PathVariable String connId, @PathVariable String db, @PathVariable String schema,
			@RequestParam(defaultValue = "tables,views,functions") String types) {
		Map<String, List<Map<String, String>>> result = new LinkedHashMap<>();
		for (String t : types.split(",")) {
			String key = "database=" + db + "/schema=" + schema + "/group=" + t.trim();
			List<TreeNode> nodes = treeService.children(connId, key);
			List<Map<String, String>> arr = new ArrayList<>();
			for (TreeNode n : nodes)
				arr.add(Map.of("name", n.label));
			result.put(t.trim(), arr);
		}
		return result;
	}
}