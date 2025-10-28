package com.deego.model;

import com.deego.config.Actions;
import lombok.Data;

import java.util.List;

@Data
public class TreeNode {
	private String id;
	private String name;
	private String type;
	private String dbType;
	private String host;
	private Integer port;
	private String database;
	private String username;
	private Long parentId;
	private Boolean connected;
	private Boolean expanded;
	private Boolean virtual;
	private String subType;
	private String icon;
	private Actions config; // YAML actions 等
	private List<TreeNode> children;
}