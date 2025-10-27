package com.slx.nebula.tree.resolver;

import com.slx.nebula.tree.config.DbTreeTemplate;
import com.slx.nebula.tree.model.TreeNode;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

public interface Resolver {
	List<TreeNode> resolve(Connection conn, DbTreeTemplate.ResolverDef def, Map<String, Object> ctx);
}