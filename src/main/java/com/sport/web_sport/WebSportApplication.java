package com.sport.web_sport;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WebSportApplication {

	public static void main(String[] args) {
		SpringApplication.run(WebSportApplication.class, args);
	}

}
