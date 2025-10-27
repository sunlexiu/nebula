package com.slx.nebula.controller;

import com.slx.nebula.tree.model.ChildrenRequest;
import com.slx.nebula.tree.model.TreeNode;
import com.slx.nebula.tree.service.TreeService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("tree")
public class TreeController {
	private final TreeService treeService;

	public TreeController(TreeService treeService) {
		this.treeService = treeService;
	}

	@PostMapping("/children")
	public List<TreeNode> children(@RequestBody ChildrenRequest req) {
		return treeService.children(req.connectionId, req.nodeKey);
	}
}