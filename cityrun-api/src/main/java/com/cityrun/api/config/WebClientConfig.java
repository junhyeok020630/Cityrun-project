package com.cityrun.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient geoWebClient() {
        return WebClient.builder()
                .baseUrl("http://cityrun-geo:3000")
                .build();
    }
}
