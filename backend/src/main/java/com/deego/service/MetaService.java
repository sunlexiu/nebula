package com.deego.service;

import com.deego.controller.MetaController;
import com.deego.metadata.DatabaseNodeType;
import com.deego.metadata.MetadataProvider;
import com.deego.metadata.MetadataProviderFactory;
import com.deego.model.Connection;
import com.deego.model.param.OptionParam;
import com.deego.model.pgsql.Option;
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

	public Option options(String connId, OptionParam param) {
		Connection conn = connectionService.getConnection(connId).orElseThrow(() -> new IllegalArgumentException("Connection not found: " + connId));
		MetadataProvider provider = factory.getProvider(conn.getDbType());
		return provider.getOptions(conn, param);
	}
}