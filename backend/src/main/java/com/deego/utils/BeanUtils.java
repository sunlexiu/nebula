package com.deego.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Bean 与 Map 互转工具类，使用 Jackson ObjectMapper 处理。
 * 支持嵌套对象递归转换，忽略 null 值。
 */
@Component
public class BeanUtils {

	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

	/**
	 * Bean 转为 Map<String, Object>，递归处理嵌套 Bean/List/Map。
	 *
	 * @param bean 要转换的 Bean 对象
	 * @return Map<String, Object>
	 */
	public Map<String, Object> beanToMap(Object bean) {
		if (bean == null) {
			return new HashMap<>();
		}
		try {
			JsonNode jsonNode = OBJECT_MAPPER.valueToTree(bean);
			return jsonNodeToMap(jsonNode);
		} catch (Exception e) {
			throw new RuntimeException("Bean to Map conversion failed: " + e.getMessage(), e);
		}
	}

	/**
	 * Map 转为 Bean，支持泛型。
	 *
	 * @param map  Map 数据
	 * @param clazz 目标 Bean 类
	 * @param <T>  泛型类型
	 * @return T 实例
	 */
	public <T> T mapToBean(Map<String, Object> map, Class<T> clazz) {
		if (map == null || map.isEmpty()) {
			try {
				return clazz.getDeclaredConstructor().newInstance();
			} catch (Exception e) {
				throw new RuntimeException("Failed to create empty instance of " + clazz.getSimpleName(), e);
			}
		}
		try {
			return OBJECT_MAPPER.convertValue(map, clazz);
		} catch (Exception e) {
			throw new RuntimeException("Map to Bean conversion failed for " + clazz.getSimpleName() + ": " + e.getMessage(), e);
		}
	}

	/**
	 * 内部：JsonNode 递归转为 Map（处理嵌套）。
	 */
	private Map<String, Object> jsonNodeToMap(JsonNode node) {
		Map<String, Object> map = new HashMap<>();
		if (node.isObject()) {
			Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
			while (fields.hasNext()) {
				Map.Entry<String, JsonNode> entry = fields.next();
				String key = entry.getKey();
				JsonNode value = entry.getValue();
				if (!value.isNull()) {
					map.put(key, jsonNodeToValue(value));
				}
			}
		}
		return map;
	}

	/**
	 * 内部：JsonNode 转为简单值或递归 Map/List。
	 */
	private Object jsonNodeToValue(JsonNode node) {
		if (node.isObject()) {
			return jsonNodeToMap(node);
		} else if (node.isArray()) {
			return OBJECT_MAPPER.convertValue(node, List.class);
		} else {
			return OBJECT_MAPPER.convertValue(node, Object.class);
		}
	}
}