package com.deego.metadata;

/**
 * 左侧树节点类型枚举
 * 前端和后端必须完全一致
 */
public enum DatabaseNodeType {
	DATABASE,
	SCHEMA,
	TABLE,
	VIEW,
	MATERIALIZED_VIEW,
	COLUMN,
	INDEX,
	PRIMARY_KEY,
	FOREIGN_KEY,
	FUNCTION,
	PROCEDURE,
	TRIGGER,
	SEQUENCE,
	PUBLICATION,
	SUBSCRIPTION,
	ROLE
}