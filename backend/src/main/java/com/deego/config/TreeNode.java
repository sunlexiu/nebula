package com.deego.config;

import lombok.Data;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Data
public class TreeNode {
	private String id;
	private String name;
	private String type;
	private String icon;
	private boolean virtual;
	private boolean expanded = false;
	private Integer position = Integer.MAX_VALUE;
	private List<TreeNode> children = new ArrayList<>();
	private Actions config;

	public void addChild(TreeNode child) {
		children.add(child);
	}

	public void sortChildren() {
		children.sort(Comparator.comparingInt(TreeNode::getPosition));
	}
}