package com.slx.nebula.config;

import com.slx.nebula.common.ApiResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@ControllerAdvice
public class GlobalResponseAdvice implements ResponseBodyAdvice<Object> {

	@Override
	public boolean supports(MethodParameter returnType, Class converterType) {
		return true;
	}

	@Override
	public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType, Class selectedConverterType,
			ServerHttpRequest request, ServerHttpResponse response) {
		if (body instanceof ApiResponse)
			return body;
		if (body instanceof String) {
			return "{\"code\":0,\"message\":\"success\",\"data\":" + body + "}";
		}
		return ApiResponse.success(body);
	}
}
