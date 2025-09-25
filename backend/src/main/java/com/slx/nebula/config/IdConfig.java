package com.slx.nebula.config;


import com.github.yitter.idgen.YitIdHelper;
import com.github.yitter.contract.IdGeneratorOptions;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

/**
 * @author sunlexiu
 */
@Configuration
public class IdConfig {

    @Bean
    public void initSnowflake() {
        IdGeneratorOptions options = new IdGeneratorOptions();
        options.WorkerId = 1;
        options.WorkerIdBitLength = 10;
        options.SeqBitLength = 12;
        YitIdHelper.setIdGenerator(options);
    }
}