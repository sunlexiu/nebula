package com.slx.nebula.tree.config;

import java.util.List;
import java.util.Map;

/**
 * Root YAML config model.
 */
public class DbTreeTemplate {
	public String dbType;          // POSTGRESQL / MYSQL / ...
	public int schemaVersion = 1;
	public Root root = new Root();
	public Map<String, ResolverDef> resolvers;

	public static class Root {
		public List<ChildDef> children;
	}

	/**
	 * Declarative child node under a template node (used for static groups or children topology).
	 */
	public static class ChildDef {
		public String id;          // stable id for groups, e.g., "tables", "views", "functions"
		public String type;        // "group" or entity type like "schema" if static
		public String label;       // static label or template "{name}"
		public String icon;        // icon key
		public String resolver;    // resolver name for dynamic listing (for group or root)
		public List<ChildDef> children; // static children (for entity node)
	}

	/**
	 * A resolver describes how to list children dynamically.
	 */
	public static class ResolverDef {
		public String kind;          // "sql" or "function" (we implement sql for now)
		public String sql;
		public boolean switchDatabase; // connect to target database when executing
		public List<String> params;    // names from context: database, schema, etc.
		public NodeDef node;           // how to map each row to a node
	}

	public static class NodeDef {
		public String type;
		public String label;         // e.g. "{name}"
		public String icon;
		public String key;           // e.g. "database={database}/schema={name}"
		public List<ChildDef> children; // child groups that should appear under this entity
	}
}
