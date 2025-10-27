package com.slx.nebula.repository;

import com.slx.nebula.model.ConfigItem;
import com.slx.nebula.model.ConnectionConfig;
import com.slx.nebula.model.Folder;
import com.slx.nebula.model.MoveNodeReq;

import java.util.List;

public interface ConfigRepository {
	List<ConfigItem> getTree();

	Folder saveFolder(Folder folder);

	void deleteFolder(String id);

	ConnectionConfig saveConnection(ConnectionConfig c);

	List<ConnectionConfig> listConnections();

	ConnectionConfig getConnection(String id);

	void deleteConnection(String id);

	void move(MoveNodeReq req);
}
