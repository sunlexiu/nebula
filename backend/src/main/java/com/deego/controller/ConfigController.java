package com.deego.controller;

import com.deego.model.Connection;
import com.deego.model.Folder;
import com.deego.service.ConnectionService;
import com.deego.service.FolderService;
import com.deego.utils.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

	@Autowired
	private FolderService folderService;

	@Autowired
	private ConnectionService connectionService;

	@Autowired
	private BeanUtils beanUtils;

	@GetMapping("/tree")
	public ResponseEntity<List<?>> getTree() {
		List<Folder> allFolders = folderService.getAllFolders();
		List<Connection> allConns  = connectionService.getAllConnections();

		// 1. 分组 key：找不到就归 ""
		Map<String, List<Folder>>  folderMap = allFolders.stream()
														 .collect(Collectors.groupingBy(f -> Optional.ofNullable(f.getParentId())
																									 .filter(pid -> allFolders.stream()
																															  .anyMatch(fd -> fd.getId().equals(pid)))
																									 .orElse("")));
		Map<String, List<Connection>> connMap = allConns.stream()
														.collect(Collectors.groupingBy(c -> Optional.ofNullable(c.getParentId())
																									.filter(pid -> allFolders.stream()
																															 .anyMatch(fd -> fd.getId().equals(pid)))
																									.orElse("")));

		// 1. 先拼整棵 folder 树（含子 folder）
		List<Map<String, Object>> folderTree = buildFolderTree("", folderMap, connMap);

		// 2. 再把「根 connection」并列拼到根层级
		List<Map<String, Object>> rootConns = connMap.getOrDefault("", List.of())
													 .stream().map(this::toConnectionMap).toList();

		// 3. folder 和 根 connection 并列返回
		List<Object> ans = new ArrayList<>(folderTree);
		ans.addAll(rootConns);
		return ResponseEntity.ok(ans);
	}

	/* 递归拼 folder 节点，同时把直属 connection 塞进 children */
	private List<Map<String, Object>> buildFolderTree(String parentId,
			Map<String, List<Folder>> folderMap,
			Map<String, List<Connection>> connMap) {
		return folderMap.getOrDefault(parentId, List.of()).stream().map(f -> {
			Map<String, Object> dto = beanUtils.beanToMap(f);
			dto.put("type", "folder");
			List<Map<String, Object>> children = new ArrayList<>();

			// 子 folder
			children.addAll(buildFolderTree(f.getId(), folderMap, connMap));
			// 直属 connection
			children.addAll(connMap.getOrDefault(f.getId(), List.of())
								   .stream().map(this::toConnectionMap).toList());

			dto.put("children", children);
			return dto;
		}).toList();
	}

	private Map<String, Object> toConnectionMap(Connection c) {
		Map<String, Object> m = beanUtils.beanToMap(c);
		m.put("type", "connection");
		m.put("connected", c.getConnected() != null ? c.getConnected() : false);
		m.put("children", List.of());
		return m;
	}

	/* ② folder 增删改 */
	@PostMapping("/folders")
	public ResponseEntity<Folder> createOrUpdateFolder(@RequestBody Folder folder) {
		return ResponseEntity.ok(folderService.createOrUpdateFolder(folder));
	}

	@DeleteMapping("/folders/{id}")
	public ResponseEntity<Void> deleteFolder(@PathVariable String id) {
		folderService.deleteFolder(id);
		return ResponseEntity.noContent().build();
	}

	/* ③ connection 增删改 + 测试 */
	@PostMapping("/connections")
	public ResponseEntity<Connection> createConnection(@RequestBody Connection conn) {
		return ResponseEntity.ok(connectionService.createConnection(conn));
	}

	@GetMapping("/connections")
	public ResponseEntity<List<Connection>> getConnections() {
		return ResponseEntity.ok(connectionService.getAllConnections());
	}

	@PutMapping("/connections/{id}")
	public ResponseEntity<Connection> updateConnection(@PathVariable String id, @RequestBody Connection update) {
		Connection updated = connectionService.updateConnection(id, update);
		return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
	}

	@DeleteMapping("/connections/{id}")
	public ResponseEntity<Void> deleteConnection(@PathVariable String id) {
		connectionService.deleteConnection(id);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/connections/test")
	public ResponseEntity<String> testConnection(@RequestBody Connection conn) {
		return ResponseEntity.ok(connectionService.testConnection(conn));
	}

	@GetMapping("/connections/{id}/test")
	public ResponseEntity<String> testConnection(@PathVariable String id) {
		return connectionService.getConnection(id)
								.map(c -> ResponseEntity.ok(connectionService.testConnection(c)))
								.orElseGet(() -> ResponseEntity.notFound().build());
	}
}