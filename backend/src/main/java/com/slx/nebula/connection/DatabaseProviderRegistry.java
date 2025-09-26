package com.slx.nebula.connection;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class DatabaseProviderRegistry {
    private final ApplicationContext ctx;

    public DatabaseProviderRegistry(ApplicationContext ctx) {
        this.ctx = ctx;
    }

    public DatabaseProvider getProvider(String type) {
        if (type == null) return null;
        try {
            return ctx.getBean(type.toUpperCase(), DatabaseProvider.class);
        } catch (Exception e) {
            return null;
        }
    }
}
