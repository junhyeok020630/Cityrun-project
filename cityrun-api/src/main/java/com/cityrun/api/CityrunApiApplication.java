package com.cityrun.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.cityrun") // ★ 중요: 최상위로 고정
public class CityrunApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(CityrunApiApplication.class, args);
    }
}
