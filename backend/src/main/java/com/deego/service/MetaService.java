package com.deego.service;

import com.deego.metadata.DatabaseNodeType;
import com.deego.metadata.MetadataProvider;
import com.deego.metadata.MetadataProviderFactory;
import com.deego.model.Connection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MetaService {

	@Autowired
	private ConnectionService connectionService;

	@Autowired
	private MetadataProviderFactory factory;

	public List<Map<String, Object>> listChildren(String connId,
			DatabaseNodeType nodeType,
			String fullPath) {
		Connection conn = connectionService.getConnection(connId)
										   .orElseThrow(() -> new IllegalArgumentException("Connection not found: " + connId));

		MetadataProvider provider = factory.getProvider(conn.getDbType());

		String[] segments = fullPath.isEmpty() ? new String[0] :
				fullPath.substring(0, fullPath.length() - 1).split("/");

		return provider.listChildren(connId, conn, nodeType, segments);
	}
}