package com.deego.service;

import com.deego.exec.DbExecutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MetaService {

	@Autowired
	private ConnectionService connectionService;

	/* 顶层：database 列表（示例） */
	public List<Map<String, Object>> listDatabases(String connId) {
		DbExecutor exec = connectionService.getExecutor(connId);
		String sql = "SELECT datname AS name, datname AS id FROM pg_database WHERE datistemplate = false AND datallowconn = true ORDER BY datname";
		List<Map<String, Object>> rows = exec.queryForList(sql);
		rows.forEach(r -> {
			String db = (String) r.get("name");
			r.put("id", connId + "::dbs_real::" + db);
			r.put("type", "database");
			r.put("icon", "/icons/database.svg");
			r.put("virtual", false);
			r.put("connected", true);
			r.put("children", List.of());
		});
		return rows;
	}

	/* 通用：按 path 拿下一级真实节点（示例只演示 database -> schema） */
	public List<Map<String, Object>> listChildren(String connId, String path) {
		DbExecutor exec = connectionService.getExecutor(connId);
		// path = dbs_real/postgres
		String[] segs = path.split("/");
		if (segs.length == 2 && "dbs_real".equals(segs[0])) {
			String db = segs[1];
			String sql = "SELECT nspname AS name, (('" + connId + "'||'::schemas_real::'||nspname)) AS id " +
					"FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema') ORDER BY nspname";
			List<Map<String, Object>> rows = exec.queryForList(sql);
			rows.forEach(r -> {
				r.put("type", "schema");
				r.put("icon", "/icons/schema.svg");
				r.put("virtual", false);
				r.put("connected", true);
				r.put("children", List.of());
			});
			return rows;
		}
		// 后续继续补充 table / column 等
		return List.of();
	}
}