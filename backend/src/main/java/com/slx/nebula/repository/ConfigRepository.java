package com.slx.nebula.repository;

import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.model.Folder;

import java.util.List;
import java.util.Optional;

public interface ConfigRepository {
    void saveFolder(Folder folder);
    List<Folder> findAllFolders();
    void deleteFolder(String id);

    void saveConnection(ConnectionConfig connection);
    List<ConnectionConfig> findAllConnections();
    Optional<ConnectionConfig> findConnectionById(String id);
    void deleteConnection(String id);
}
