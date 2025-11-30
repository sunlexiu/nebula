package com.deego.metadata;

/**
 * 左侧树节点类型枚举
 * 前端和后端必须完全一致
 */
public enum DatabaseNodeType {
	/**
	 * 数据库
	 */
	DATABASE,
	/**
	 * 模式
	 */
	SCHEMA,
	/**
	 * 表
	 */
	TABLE,
	/**
	 * 视图
	 */
	VIEW,
	/**
	 * 物化视图
	 */
	MATERIALIZED_VIEW,
	/**
	 * 列
	 */
	COLUMN,
	/**
	 * 约束
	 */
	CONSTRAINT,
	/**
	 * 索引
	 */
	INDEX,
	/**
	 * 主键
	 */
	PRIMARY_KEY,
	/**
	 * 外键
	 */
	FOREIGN_KEY,
	/**
	 * 函数
	 */
	FUNCTION,
	/**
	 * 存储过程
	 */
	PROCEDURE,
	/**
	 * 触发器
	 */
	TRIGGER,
	/**
	 * 序列
	 */
	SEQUENCE,
	/**
	 * 发布
	 */
	PUBLICATION,
	/**
	 * 订阅
	 */
	SUBSCRIPTION,
	/**
	 * 角色
	 */
	ROLE
}
