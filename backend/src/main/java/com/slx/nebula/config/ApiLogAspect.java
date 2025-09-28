package com.slx.nebula.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class ApiLogAspect {

    private static final Logger log = LoggerFactory.getLogger(ApiLogAspect.class);

    private final ObjectMapper objectMapper;

    public ApiLogAspect() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void controllerMethods() {}

    @Around("controllerMethods()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        Object[] args = joinPoint.getArgs();

        log.info("👉 请求方法: {} 入参: {}", methodName, toSafeJson(args));

        Object result = joinPoint.proceed();

        log.info("👈 响应方法: {} 出参: {}", methodName, toSafeJson(result));

        return result;
    }

    /**
     * 转换为安全的 JSON，自动脱敏敏感字段
     */
    private String toSafeJson(Object obj) {
        if (obj == null) return "null";

        try {
            // 特殊对象直接忽略
            if (obj instanceof HttpServletRequest
                    || obj instanceof HttpServletResponse
                    || obj instanceof MultipartFile) {
                return "\"[ignored]\"";
            }

            String json = objectMapper.writeValueAsString(obj);

            // 脱敏处理 (简单替换敏感字段)
            json = json.replaceAll("(?i)\"password\"\\s*:\\s*\".*?\"", "\"password\":\"******\"");
            json = json.replaceAll("(?i)\"pwd\"\\s*:\\s*\".*?\"", "\"pwd\":\"******\"");
            json = json.replaceAll("(?i)\"secret\"\\s*:\\s*\".*?\"", "\"secret\":\"******\"");

            return json;
        } catch (JsonProcessingException e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "序列化失败: " + e.getMessage());
            try {
                return objectMapper.writeValueAsString(err);
            } catch (JsonProcessingException ex) {
                return "{error:serialization_failed}";
            }
        }
    }
}
