package com.slx.nebula.tree.resolver;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ResolverRegistry {
	private final Map<String, Resolver> resolvers = new HashMap<>();

	public ResolverRegistry() {
		resolvers.put("sql", new SqlResolver());
	}

	public Resolver get(String kind) {
		Resolver r = resolvers.get(kind);
		if (r == null)
			throw new IllegalArgumentException("Unknown resolver kind: " + kind);
		return r;
	}
}