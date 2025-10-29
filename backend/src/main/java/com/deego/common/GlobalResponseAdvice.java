package com.deego.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * 全局返回/异常统一封装： - 成功：将非 ApiResponse 的返回统一包装为 ApiResponse.ok(data) - 异常：统一转为 ApiResponse.error(...) - 特殊处理：String、ResponseEntity、文件下载（attachment）不二次包装
 */
@RestControllerAdvice
@Slf4j
public class GlobalResponseAdvice implements ResponseBodyAdvice<Object> {

	private final ObjectMapper objectMapper = new ObjectMapper();

	/* ================== 统一返回包装 ================== */

	@Override
	public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
		return ResponseEntity.class.isAssignableFrom(returnType.getParameterType());
	}

	@Override
	public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
			Class<? extends HttpMessageConverter<?>> selectedConverterType, ServerHttpRequest request, ServerHttpResponse response) {

		// 如果是文件下载或明确的附件，直接透传
		if (isAttachment(response))
			return body;

		// 已经是统一结构，直接返回
		if (body instanceof ApiResponse<?>)
			return body;

		// 对 String 特殊处理（避免 StringHttpMessageConverter 报错）
		if (body instanceof String s) {
			try {
				return objectMapper.writeValueAsString(ApiResponse.ok(s));
			} catch (JsonProcessingException e) {
				return s; // 回退：不阻断原始返回
			}
		}

		// 对 ResponseEntity 已在 supports 中排除；但稳妥起见再次判断
		if (body instanceof ResponseEntity<?>)
			return body;

		// 其他常规对象统一包装
		return ApiResponse.ok(body);
	}

	private boolean isAttachment(ServerHttpResponse response) {
		try {
			HttpHeaders headers = response.getHeaders();
			// 部分容器此处可能为不可变 headers，可从 Servlet 层再兜底判断
			ContentDisposition cd = headers.getContentDisposition();
			if (cd.isAttachment())
				return true;

			if (response instanceof ServletServerHttpResponse servletResp) {
				String disp = servletResp.getServletResponse().getHeader(HttpHeaders.CONTENT_DISPOSITION);
				if (disp != null && disp.toLowerCase().contains("attachment"))
					return true;
			}

			MediaType mt = headers.getContentType();
			// 常见的二进制、octet-stream 直接透传
			if (MediaType.APPLICATION_OCTET_STREAM.equals(mt))
				return true;
		} catch (Exception ex) {
			log.error("Error in isAttachment: ", ex);
		}
		return false;
	}
}
