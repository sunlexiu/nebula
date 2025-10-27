package com.slx.nebula.tree.resolver;

import com.slx.nebula.tree.config.DbTreeTemplate;
import com.slx.nebula.tree.model.TreeNode;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SqlResolver implements Resolver {
	public List<TreeNode> resolve(Connection conn, DbTreeTemplate.ResolverDef def, Map<String, Object> ctx) {
		List<TreeNode> out = new ArrayList<>();
		if (def.sql == null || def.node == null)
			return out;
		String sql = def.sql;
		List<String> order = new ArrayList<>();
		if (def.params != null)
			for (String p : def.params) {
				String token = ":" + p;
				if (sql.contains(token)) {
					sql = sql.replace(token, "?");
					order.add(p);
				}
			}
		try (PreparedStatement ps = conn.prepareStatement(sql)) {
			int idx = 1;
			for (String p : order) {
				Object v = ctx.get(p);
				ps.setObject(idx++, v);
			}
			try (ResultSet rs = ps.executeQuery()) {
				ResultSetMetaData md = rs.getMetaData();
				int n = md.getColumnCount();
				while (rs.next()) {
					Map<String, Object> row = new HashMap<>();
					for (int i = 1; i <= n; i++) {
						row.put(md.getColumnLabel(i), rs.getObject(i));
					}
					out.add(mapRowToNode(def.node, row, ctx));
				}
			}
		} catch (SQLException e) {
			TreeNode err = new TreeNode();
			err.key = "error:" + e.getClass().getSimpleName();
			err.type = "error";
			err.label = e.getMessage();
			err.icon = "error";
			err.hasChildren = false;
			out.add(err);
		}
		return out;
	}

	private TreeNode mapRowToNode(DbTreeTemplate.NodeDef nodeDef, Map<String, Object> row, Map<String, Object> ctx) {
		TreeNode n = new TreeNode();
		n.type = eval(nodeDef.type, row, ctx);
		n.label = eval(nodeDef.label, row, ctx);
		n.icon = eval(nodeDef.icon, row, ctx);
		n.key = eval(nodeDef.key, row, ctx);
		n.hasChildren = nodeDef.children != null && !nodeDef.children.isEmpty();
		Map<String, Object> meta = new HashMap<>(ctx);
		for (Map.Entry<String, Object> e : row.entrySet())
			meta.putIfAbsent(e.getKey(), e.getValue());
		n.meta = meta;
		return n;
	}

	private String eval(String tpl, Map<String, Object> row, Map<String, Object> ctx) {
		if (tpl == null)
			return null;
		String s = tpl;
		for (Map.Entry<String, Object> e : row.entrySet())
			if (e.getValue() != null)
				s = s.replace("{" + e.getKey() + "}", String.valueOf(e.getValue()));
		for (Map.Entry<String, Object> e : ctx.entrySet())
			if (e.getValue() != null)
				s = s.replace("{" + e.getKey() + "}", String.valueOf(e.getValue()));
		return s;
	}
}