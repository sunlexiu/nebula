package com.slx.nebula.config;

import com.github.yitter.contract.IdGeneratorOptions;
import com.github.yitter.idgen.YitIdHelper;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

/**
 * @author sunlexiu
 */
@Configuration
public class IdGeneratorConfig {

    @PostConstruct
    public void init() {
        IdGeneratorOptions options = new IdGeneratorOptions((short) 1);
        YitIdHelper.setIdGenerator(options);
    }

}
