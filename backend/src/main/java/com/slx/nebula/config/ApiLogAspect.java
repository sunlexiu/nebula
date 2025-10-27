package com.slx.nebula.config;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;
@Aspect @Component public class ApiLogAspect {
    private static final Logger log = LoggerFactory.getLogger(ApiLogAspect.class);
    @Pointcut("execution(* com.slx.nebula.controller..*(..))") public void api(){}
    @AfterReturning(pointcut="api()", returning="ret") public void after(JoinPoint jp, Object ret){
        try{ log.info("API {} args: {}", jp.getSignature().toShortString(), Arrays.toString(jp.getArgs())); }catch(Exception ignore){}
    }
}