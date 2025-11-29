package com.deego.service;

import com.deego.metadata.DatabaseNodeType;
import com.deego.metadata.MetadataProvider;
import com.deego.metadata.MetadataProviderFactory;
import com.deego.model.Connection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class MetaService {

	@Autowired
	private ConnectionService connectionService;

	@Autowired
	private MetadataProviderFactory factory;

	public List<Map<String, Object>> listChildren(String connId, DatabaseNodeType nodeType, String fullPath) {
		Connection conn = connectionService.getConnection(connId).orElseThrow(() -> new IllegalArgumentException("Connection not found: " + connId));
		MetadataProvider provider = factory.getProvider(conn.getDbType());
		fullPath = Objects.isNull(fullPath) ?
				"" :
				StringUtils.trimLeadingCharacter(StringUtils.trimTrailingCharacter(fullPath, '/'), '/');
		String[] segments = fullPath.split("/");
		return provider.listChildren(connId, conn, nodeType, segments);
	}
}