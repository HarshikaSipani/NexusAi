package com.nexusai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

@SpringBootApplication
@EnableMongoAuditing
public class Application {

    public static void main(String[] args) {
        loadDotEnv();
        
        // Ensure Spring Boot uses the PORT from .env
        String port = System.getProperty("PORT");
        if (port != null && !port.isEmpty()) {
            System.setProperty("server.port", port);
        } else {
            System.setProperty("server.port", "5000"); // default fallback
        }

        // Map MONGODB_URI to Spring Data MongoDB URI
        String mongoUri = System.getProperty("MONGODB_URI");
        if (mongoUri != null && !mongoUri.isEmpty()) {
            System.setProperty("spring.data.mongodb.uri", mongoUri);
        }

        // Enable automatic index creation
        System.setProperty("spring.data.mongodb.auto-index-creation", "true");

        SpringApplication.run(Application.class, args);
    }

    private static void loadDotEnv() {
        File dotEnv = new File(".env");
        if (!dotEnv.exists()) {
            // Fallback to parent directory just in case Cwd is nested
            dotEnv = new File("../.env");
        }
        
        if (dotEnv.exists()) {
            System.out.println("✅ Found .env file, loading environment variables...");
            try (BufferedReader reader = new BufferedReader(new FileReader(dotEnv))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    int equalsIdx = line.indexOf('=');
                    if (equalsIdx > 0) {
                        String key = line.substring(0, equalsIdx).trim();
                        String value = line.substring(equalsIdx + 1).trim();
                        
                        // Strip quotes if any
                        if ((value.startsWith("\"") && value.endsWith("\"")) || 
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        
                        System.setProperty(key, value);
                        System.out.println("Loaded env var: " + key);
                    }
                }
            } catch (IOException e) {
                System.err.println("❌ Failed to load .env file: " + e.getMessage());
            }
        } else {
            System.out.println("⚠️ No .env file found, using system environment variables.");
        }
    }
}
