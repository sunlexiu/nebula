package com.deego.controller;

import com.deego.model.Connection;
import com.deego.model.Folder;
import com.deego.service.ConnectionService;
import com.deego.service.FolderService;
import com.deego.service.TreeService;
import com.deego.utils.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/config")
public class ConfigController {
	@Autowired
	private ConnectionService connectionService;
	@Autowired
	private TreeService treeService;
	@Autowired
	private FolderService folderService;
	@Autowired
	private BeanUtils beanUtils;

	@GetMapping("/tree")
	public ResponseEntity<List<Map<String, Object>>> getTree() {
		return ResponseEntity.ok(treeService.getTreeData().stream().map(beanUtils::beanToMap).toList());
	}

	@PostMapping("/folders")
	public ResponseEntity<Folder> createOrUpdateFolder(@RequestBody Folder folder) {
		if (folder.getId() != null && folder.getId() > 0) {
			// 重命名：更新 name
			Optional<Folder> existing = folderService.getFolder(folder.getId());
			if (existing.isPresent()) {
				existing.get().setName(folder.getName());
				return ResponseEntity.ok(folderService.createOrUpdateFolder(existing.get()));
			}
		}
		// 新建
		return ResponseEntity.ok(folderService.createOrUpdateFolder(folder));
	}

	// 新增：/api/config/folders/{id} (DELETE)
	@DeleteMapping("/folders/{id}")
	public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
		folderService.deleteFolder(id);
		return ResponseEntity.noContent().build();
	}

	// 新增：/api/config/folders (GET: 所有文件夹，未来用于树构建)
	@GetMapping("/folders")
	public ResponseEntity<List<Folder>> getFolders() {
		return ResponseEntity.ok(folderService.getAllFolders());
	}

	@PostMapping("/connections")
	public ResponseEntity<Connection> createConnection(@RequestBody Connection conn) {
		return ResponseEntity.ok(connectionService.createConnection(conn));
	}

	@GetMapping("/connections")
	public ResponseEntity<List<Connection>> getConnections() {
		return ResponseEntity.ok(connectionService.getAllConnections());
	}

	@PutMapping("/connections/{id}")
	public ResponseEntity<Connection> updateConnection(@PathVariable Long id, @RequestBody Connection update) {
		Connection updated = connectionService.updateConnection(id, update);
		return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
	}

	@DeleteMapping("/connections/{id}")
	public ResponseEntity<Void> deleteConnection(@PathVariable Long id) {
		connectionService.deleteConnection(id);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/connections/test")
	public ResponseEntity<String> testConnection(@RequestBody Connection conn) {
		return ResponseEntity.ok(connectionService.testConnection(conn));
	}

	@GetMapping("/connections/{id}/config")
	public ResponseEntity<Map<String, Object>> getConfig(@PathVariable Long id) {
		// 返回 YAML config for conn (简化，返回全 POSTGRESQL config)
		Map<String, Object> config = Map.of("dbType", "POSTGRESQL", "actions", Map.of()); // 从 loader
		return ResponseEntity.ok(config);
	}
}