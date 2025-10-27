package com.slx.nebula.tree.service;

import com.slx.nebula.connection.DatabaseProvider;
import com.slx.nebula.connection.DatabaseProviderRegistry;
import com.slx.nebula.enums.DbTypeEnum;
import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.repository.ConfigRepository;
import com.slx.nebula.tree.config.DbTreeTemplate;
import com.slx.nebula.tree.config.TreeConfigLoader;
import com.slx.nebula.tree.model.TreeNode;
import com.slx.nebula.tree.resolver.Resolver;
import com.slx.nebula.tree.resolver.ResolverRegistry;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.sql.Connection;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TreeService {
	private final ConfigRepository repo;
	private final DatabaseProviderRegistry providers;
	private final TreeConfigLoader loader;
	private final ResolverRegistry resolverRegistry;

	public TreeService(ConfigRepository repo, DatabaseProviderRegistry providers, TreeConfigLoader loader, ResolverRegistry resolverRegistry) {
		this.repo = repo;
		this.providers = providers;
		this.loader = loader;
		this.resolverRegistry = resolverRegistry;
	}

	public List<TreeNode> children(String connectionId, String nodeKey) {
		ConnectionConfig cfg = repo.getConnection(connectionId);
		if (cfg == null)
			return List.of();
		DbTypeEnum dbType = cfg.dbType;
		DbTreeTemplate tpl = loader.get(dbType.name());
		if (tpl == null)
			return List.of();
		Map<String, Object> ctx = parseKey(nodeKey);
		String database = (String)ctx.get("database");
		DatabaseProvider provider = providers.of(dbType);
		if (!StringUtils.hasText(nodeKey)) {
			return runResolver(provider, cfg, tpl, null, ctx, true);
		}
		List<TreeNode> entityChildren = tryStaticChildrenForEntity(tpl, ctx);
		if (entityChildren != null)
			return entityChildren;
		String group = (String)ctx.get("group");
		if (group != null) {
			return runResolver(provider, cfg, tpl, group, ctx, false);
		}
		if (ctx.containsKey("database") && !ctx.containsKey("schema")) {
			return runResolver(provider, cfg, tpl, "schemas", ctx, false);
		}
		return List.of();
	}

	private List<TreeNode> tryStaticChildrenForEntity(DbTreeTemplate tpl, Map<String, Object> ctx) {
		if (ctx.containsKey("database") && ctx.containsKey("schema") && !ctx.containsKey("group")) {
			DbTreeTemplate.ResolverDef schemaRes = tpl.resolvers.get("schemas");
			if (schemaRes != null && schemaRes.node != null && schemaRes.node.children != null) {
				List<TreeNode> out = new ArrayList<>();
				for (DbTreeTemplate.ChildDef ch : schemaRes.node.children) {
					TreeNode n = new TreeNode();
					n.type = ch.type != null ? ch.type : "group";
					n.label = ch.label != null ? ch.label : ch.id;
					n.icon = ch.icon != null ? ch.icon : "folder";
					n.key = buildKey(ctx) + "/group=" + ch.id;
					n.hasChildren = (ch.resolver != null);
					out.add(n);
				}
				return out;
			}
		}
		return null;
	}

	private String buildKey(Map<String, Object> ctx) {
		List<String> parts = new ArrayList<>();
		if (ctx.get("database") != null)
			parts.add("database=" + ctx.get("database"));
		if (ctx.get("schema") != null)
			parts.add("schema=" + ctx.get("schema"));
		if (ctx.get("group") != null)
			parts.add("group=" + ctx.get("group"));
		return String.join("/", parts);
	}

	private List<TreeNode> runResolver(DatabaseProvider provider, ConnectionConfig cfg, DbTreeTemplate tpl, String resolverNameOrNullForRoot,
			Map<String, Object> ctx, boolean root) {
		DbTreeTemplate.ResolverDef def;
		if (root) {
			if (tpl.root == null || tpl.root.children == null || tpl.root.children.isEmpty())
				return List.of();
			DbTreeTemplate.ChildDef c = tpl.root.children.get(0);
			if (c.resolver == null)
				return List.of();
			def = tpl.resolvers.get(c.resolver);
		} else {
			def = tpl.resolvers.get(resolverNameOrNullForRoot);
		}
		if (def == null)
			return List.of();
		Resolver r = resolverRegistry.get(def.kind);
		String dbToUse = def.switchDatabase ? (String)ctx.getOrDefault("database", cfg.database) : cfg.database;
		try (Connection conn = provider.createConnection(cfg.host, cfg.port, dbToUse, cfg.username, cfg.password)) {
			return r.resolve(conn, def, ctx);
		} catch (Exception e) {
			TreeNode err = new TreeNode();
			err.type = "error";
			err.icon = "error";
			err.label = e.getMessage();
			err.key = "error";
			err.hasChildren = false;
			return List.of(err);
		}
	}

	private Map<String, Object> parseKey(String key) {
		Map<String, Object> m = new LinkedHashMap<>();
		if (key == null || key.isBlank())
			return m;
		for (String p : key.split("/")) {
			int i = p.indexOf('=');
			if (i > 0) {
				m.put(p.substring(0, i), p.substring(i + 1));
			}
		}
		return m;
	}
}