package com.cityrun.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient; // 💡 추가 임포트
import java.time.Duration; // 💡 추가 임포트

@Configuration
public class WebClientConfig {

        // Geo Engine WebClient
        @Bean
        public WebClient geoWebClient() {
                // 💡 타임아웃 60초로 설정
                HttpClient httpClient = HttpClient.create()
                                .responseTimeout(Duration.ofSeconds(60));

                return WebClient.builder()
                                .baseUrl("http://cityrun-geo:3000")
                                // 💡 ReactorClientHttpConnector를 사용하여 타임아웃 적용
                                .clientConnector(new ReactorClientHttpConnector(httpClient))
                                .build();
        }
}