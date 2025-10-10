package com.slx.nebula.config;

import com.slx.nebula.common.ApiResponse;
import com.slx.nebula.common.ErrorCode;
import com.slx.nebula.exception.BizException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJacksonValue;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * 统一封装返回结果
 */
@ControllerAdvice
@Slf4j
public class GlobalResponseAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        // 对所有返回类型生效
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {

        // 已经是统一包装类型的，直接返回
        if (body instanceof ApiResponse) {
            return body;
        }

        // 对于字符串特殊处理，防止类型转换异常
        if (body instanceof String) {
            // 手动序列化成 JSON 字符串
            try {
                return new com.fasterxml.jackson.databind.ObjectMapper()
                        .writeValueAsString(ApiResponse.success(body));
            } catch (Exception e) {

                throw new BizException(ErrorCode.SYSTEM_ERROR);
            }
        }

        ApiResponse<Object> result = ApiResponse.success(body);
        MappingJacksonValue wrapper = new MappingJacksonValue(result);
        wrapper.setSerializationView(returnType.getContainingClass());
        return wrapper;
    }
}
