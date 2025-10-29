package com.deego.controller;

import com.deego.service.FolderService;
import com.deego.service.ConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class MoveController {

	@Autowired
	private FolderService folderService;

	@Autowired
	private ConnectionService connectionService;

	/**
	 * /api/config/move-node (POST): 移动节点（文件夹或连接）。
	 * body: {sourceId: "...", targetParentId: null/123, type: "folder"/"connection"}
	 */
	@PostMapping("/move-node")
	public ResponseEntity<String> moveNode(@RequestBody Map<String, Object> request) {
		String sourceId = (String) request.get("sourceId");
		String targetParentId = request.get("targetParentId") != null ? (String) request.get("targetParentId") : null;
		String type = (String) request.get("type");

		try {
			if ("folder".equals(type)) {
				// 更新 Folder parentId
				String sourceFolderId =sourceId.replace("folder_", "");
				folderService.getFolder(sourceFolderId).ifPresent(folder -> {
					folder.setParentId(targetParentId);
					folderService.createOrUpdateFolder(folder);
				});
			} else if ("connection".equals(type)) {
				// 更新 Connection parentId
				connectionService.getConnection(sourceId).ifPresent(conn -> {
					conn.setParentId(targetParentId);
					connectionService.updateConnection(sourceId, conn);  // 复用更新
				});
			}
			return ResponseEntity.ok("Node moved successfully");
		} catch (Exception e) {
			return ResponseEntity.badRequest().body("Move failed: " + e.getMessage());
		}
	}
}