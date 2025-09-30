package com.slx.nebula.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slx.nebula.model.*;
import com.github.yitter.idgen.YitIdHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@Slf4j
public class FileConfigRepository implements ConfigRepository {

    private final Path configFile;
    private final ObjectMapper mapper = new ObjectMapper();
    private ConfigData cache;

    public FileConfigRepository() {
        String userHome = System.getProperty("user.dir");
        this.configFile = Paths.get(userHome, ".nebula", "config.json");
        log.info("Config file path-----> {}", configFile);
        load();
    }

    private synchronized void load() {
        try {
            if (Files.exists(configFile)) {
                cache = mapper.readValue(configFile.toFile(), ConfigData.class);
            } else {
                cache = new ConfigData();
                persist();
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load config file", e);
        }
    }

    private synchronized void persist() {
        try {
            Files.createDirectories(configFile.getParent());
            mapper.writerWithDefaultPrettyPrinter().writeValue(configFile.toFile(), cache);
        } catch (IOException e) {
            throw new RuntimeException("Failed to persist config file", e);
        }
    }

    // -------------------- 新增：返回整个树 --------------------
    public synchronized ConfigData loadAll() {
        return cache;
    }

    // -------------------- 工具方法 --------------------
    private void traverse(Iterable<ConfigItem> items, java.util.function.Consumer<ConfigItem> consumer) {
        for (ConfigItem it : items) {
            consumer.accept(it);
            if (it instanceof Folder) {
                traverse(((Folder) it).getChildren(), consumer);
            }
        }
    }

    private Optional<Folder> findFolderNode(String id) {
        AtomicBoolean found = new AtomicBoolean(false);
        final Folder[] holder = new Folder[1];
        traverse(cache.getRoots(), item -> {
            if (!found.get() && item instanceof Folder && id.equals(item.getId())) {
                holder[0] = (Folder) item;
                found.set(true);
            }
        });
        return Optional.ofNullable(holder[0]);
    }

    private Optional<ConnectionConfig> findConnectionNode(String id) {
        AtomicBoolean found = new AtomicBoolean(false);
        final ConnectionConfig[] holder = new ConnectionConfig[1];
        traverse(cache.getRoots(), item -> {
            if (!found.get() && item instanceof ConnectionConfig && id.equals(item.getId())) {
                holder[0] = (ConnectionConfig) item;
                found.set(true);
            }
        });
        return Optional.ofNullable(holder[0]);
    }

    private Optional<ConfigItem> findAnyNode(String id) {
        AtomicBoolean found = new AtomicBoolean(false);
        final ConfigItem[] holder = new ConfigItem[1];
        traverse(cache.getRoots(), item -> {
            if (!found.get() && id.equals(item.getId())) {
                holder[0] = item;
                found.set(true);
            }
        });
        return Optional.ofNullable(holder[0]);
    }

    private boolean removeNodeRecursively(List<ConfigItem> list, String id) {
        Iterator<ConfigItem> it = list.iterator();
        while (it.hasNext()) {
            ConfigItem ci = it.next();
            if (id.equals(ci.getId())) {
                it.remove();
                return true;
            } else if (ci instanceof Folder) {
                if (removeNodeRecursively(((Folder) ci).getChildren(), id)) return true;
            }
        }
        return false;
    }

    // -------------------- ConfigRepository 实现 --------------------
    @Override
    public synchronized void saveFolder(Folder folder) {
        if (folder.getId() == null) {
            folder.setId(String.valueOf(YitIdHelper.nextId()));
        }
        Optional<ConfigItem> existing = findAnyNode(folder.getId());
        if (existing.isPresent()) {
            Folder ex = (Folder) existing.get();
            ex.setName(folder.getName());
            ex.setParentId(folder.getParentId());
        } else {
            if (folder.getParentId() == null) {
                cache.getRoots().add(folder);
            } else {
                findFolderNode(folder.getParentId())
                        .ifPresentOrElse(f -> f.getChildren().add(folder), () -> cache.getRoots().add(folder));
            }
        }
        persist();
    }

    @Override
    public synchronized List<Folder> findAllFolders() {
        List<Folder> out = new ArrayList<>();
        traverse(cache.getRoots(), item -> {
            if (item instanceof Folder) out.add((Folder) item);
        });
        return out;
    }

    @Override
    public synchronized void deleteFolder(String id) {
        if (removeNodeRecursively(cache.getRoots(), id)) persist();
    }

    @Override
    public synchronized void saveConnection(ConnectionConfig connection) {
        if (connection.getId() == null) {
            connection.setId(String.valueOf(YitIdHelper.nextId()));
        }
        Optional<ConfigItem> existing = findAnyNode(connection.getId());
        if (existing.isPresent()) {
            ConnectionConfig ex = (ConnectionConfig) existing.get();
            ex.setName(connection.getName());
            ex.setDbType(connection.getDbType());
            ex.setHost(connection.getHost());
            ex.setPort(connection.getPort());
            ex.setDatabase(connection.getDatabase());
            ex.setUsername(connection.getUsername());
            ex.setPassword(connection.getPassword());
            ex.setParentId(connection.getParentId());
        } else {
            if (connection.getParentId() == null) {
                cache.getRoots().add(connection);
            } else {
                findFolderNode(connection.getParentId())
                        .ifPresentOrElse(f -> f.getChildren().add(connection), () -> cache.getRoots().add(connection));
            }
        }
        persist();
    }

    @Override
    public synchronized List<ConnectionConfig> findAllConnections() {
        List<ConnectionConfig> out = new ArrayList<>();
        traverse(cache.getRoots(), item -> {
            if (item instanceof ConnectionConfig) out.add((ConnectionConfig) item);
        });
        return out;
    }

    @Override
    public synchronized Optional<ConnectionConfig> findConnectionById(String id) {
        return findConnectionNode(id);
    }

    @Override
    public synchronized void deleteConnection(String id) {
        if (removeNodeRecursively(cache.getRoots(), id)) persist();
    }
}
