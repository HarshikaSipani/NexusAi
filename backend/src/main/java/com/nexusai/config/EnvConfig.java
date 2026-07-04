package com.nexusai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EnvConfig {

    @Value("${CF_ACCOUNT_ID:}")
    private String cfAccountId;

    @Value("${CF_API_TOKEN:}")
    private String cfApiToken;

    @Value("${JWT_SECRET:supersecretkey123}")
    private String jwtSecret;

    @Value("${CLIENT_URL:http://localhost:5173}")
    private String clientUrl;

    public String getCfAccountId() {
        return cfAccountId;
    }

    public String getCfApiToken() {
        return cfApiToken;
    }

    public String getJwtSecret() {
        return jwtSecret;
    }

    public String getClientUrl() {
        return clientUrl;
    }
}
