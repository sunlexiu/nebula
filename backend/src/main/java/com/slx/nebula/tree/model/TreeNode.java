package com.slx.nebula.tree.model;

import java.util.List;
import java.util.Map;

public class TreeNode {
	public String key;
	public String type;
	public String label;
	public String icon;
	public boolean hasChildren;
	public Map<String, Object> meta;
	public List<Map<String, Object>> badges;
	public List<Map<String, Object>> actions;
}