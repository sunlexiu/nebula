package com.slx.nebula.connection;

import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.repository.ConfigRepository;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SessionManager {
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final DatabaseProviderRegistry registry;
    private final ConfigRepository configRepository;

    public SessionManager(DatabaseProviderRegistry registry, ConfigRepository configRepository) {
        this.registry = registry;
        this.configRepository = configRepository;
    }

    public Session createSession(String editorId, String connectionId) {
        if (sessions.containsKey(editorId)) {
            return sessions.get(editorId);
        }
        ConnectionConfig cfg = configRepository.findConnectionById(connectionId)
                .orElseThrow(() -> new RuntimeException("connection not found: " + connectionId));
        DatabaseProvider provider = registry.getProvider(cfg.getType());
        if (provider == null) {
            throw new RuntimeException("no provider: " + cfg.getType());
        }
        DataSource ds = provider.createDataSource(cfg);
        Session s = new Session(editorId, cfg, ds);
        sessions.put(editorId, s);
        return s;
    }

    public Session getSession(String editorId) {
        return sessions.get(editorId);
    }

    public void closeSession(String editorId) {
        Session s = sessions.remove(editorId);
        if (s != null) s.close();
    }
}
