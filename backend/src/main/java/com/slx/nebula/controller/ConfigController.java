package com.slx.nebula.controller;

import com.slx.nebula.model.ConfigItem;
import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.model.Folder;
import com.slx.nebula.model.MoveNodeReq;
import com.slx.nebula.repository.ConfigRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/config")
public class ConfigController {
	private final ConfigRepository repo;

	public ConfigController(ConfigRepository repo) {
		this.repo = repo;
	}

	@GetMapping("/tree")
	public List<ConfigItem> tree() {
		return repo.getTree();
	}

	@PostMapping("/folders")
	public Folder saveFolder(@RequestBody Folder f) {
		return repo.saveFolder(f);
	}

	@DeleteMapping("/folders/{id}")
	public void deleteFolder(@PathVariable String id) {
		repo.deleteFolder(id);
	}

	@PostMapping("/move-node")
	public void move(@RequestBody MoveNodeReq req) {
		repo.move(req);
	}

	@PostMapping("/connections")
	public ConnectionConfig saveConn(@RequestBody ConnectionConfig c) {
		return repo.saveConnection(c);
	}

	@GetMapping("/connections")
	public List<ConnectionConfig> listConn() {
		return repo.listConnections();
	}

	@GetMapping("/connections/{id}")
	public ConnectionConfig getConn(@PathVariable String id) {
		return repo.getConnection(id);
	}

	@DeleteMapping("/connections/{id}")
	public void delConn(@PathVariable String id) {
		repo.deleteConnection(id);
	}
}