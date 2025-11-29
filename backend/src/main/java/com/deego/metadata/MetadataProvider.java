package com.deego.metadata;

import com.deego.enums.DatabaseType;
import com.deego.model.Connection;

import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 数据库元数据提供者接口
 * 每种数据库实现一个子类
 */
public interface MetadataProvider {

	/**
	 * 数据库类型
	 */
	DatabaseType dbType();

	/**
	 * 查询下一层子节点
	 *
	 * @param connId       连接ID（用于生成节点唯一ID）
	 * @param connection  连接实体（包含 host、dbType 等信息）
	 * @param nodeType     当前要展开的节点类型
	 * @param pathSegments 从根到父节点的路径分段，例如 ["mydb", "public"] 表示展开 public schema 下的内容
	 * @return 子节点列表
	 */
	List<Map<String, Object>> listChildren(String connId, Connection connection, DatabaseNodeType nodeType, String[] pathSegments);
}