package com.slx.nebula.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.yitter.idgen.YitIdHelper;
import com.slx.nebula.model.ConfigData;
import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.model.Folder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class FileConfigRepository implements ConfigRepository {

    private final Path configFile;
    private final ObjectMapper mapper = new ObjectMapper();
    private ConfigData cache;

    public FileConfigRepository() {
        String userHome = System.getProperty("user.dir");
        this.configFile = Paths.get(userHome, ".nebula", "config.json");
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

    @Override
    public synchronized void saveFolder(Folder folder) {
        if (folder.getId() == null) folder.setId(String.valueOf(YitIdHelper.nextId()));
        cache.getFolders().removeIf(f -> f.getId().equals(folder.getId()));
        cache.getFolders().add(folder);
        persist();
    }

    @Override
    public synchronized List<Folder> findAllFolders() {
        return cache.getFolders();
    }

    @Override
    public synchronized void deleteFolder(String id) {
        cache.getFolders().removeIf(f -> f.getId().equals(id));
        cache.getConnections().removeIf(c -> id.equals(c.getFolderId()));
        persist();
    }

    @Override
    public synchronized void saveConnection(ConnectionConfig connection) {
        if (connection.getId() == null) connection.setId(String.valueOf(YitIdHelper.nextId()));
        cache.getConnections().removeIf(c -> c.getId().equals(connection.getId()));
        cache.getConnections().add(connection);
        persist();
    }

    @Override
    public synchronized List<ConnectionConfig> findAllConnections() {
        return cache.getConnections();
    }

    @Override
    public synchronized Optional<ConnectionConfig> findConnectionById(String id) {
        return cache.getConnections().stream().filter(c -> c.getId().equals(id)).findFirst();
    }

    @Override
    public synchronized void deleteConnection(String id) {
        cache.getConnections().removeIf(c -> c.getId().equals(id));
        persist();
    }
}
