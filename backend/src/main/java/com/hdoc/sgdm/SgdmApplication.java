package com.hdoc.sgdm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SgdmApplication {

	public static void main(String[] args) {
		SpringApplication.run(SgdmApplication.class, args);
	}

}