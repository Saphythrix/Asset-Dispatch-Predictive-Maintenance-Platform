package com.enterprise.fleet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FleetServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(FleetServiceApplication.class, args);
	}

}
