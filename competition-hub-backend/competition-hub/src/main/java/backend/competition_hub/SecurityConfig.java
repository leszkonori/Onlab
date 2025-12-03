//package backend.competition_hub;
//
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.web.SecurityFilterChain;
//
//@Configuration
//public class SecurityConfig {
//
//    @Bean
//    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//        return http
//                .authorizeHttpRequests(auth -> auth
//                        .requestMatchers("/api/**").authenticated()
//                        .anyRequest().permitAll()
//                )
//                .formLogin()  // engedélyezi az alap login formot
//                .and()
//                .build();
//    }
//}
package backend.competition_hub;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // REST API-hoz: CSRF letiltása (Keycloak JWT token alapú)
                .csrf(csrf -> csrf.disable())

                // CORS konfiguráció (az Ön WebConfig.java-ja kezeli)
                //.cors(cors -> cors.disable())

                // Beállítja, hogy az alkalmazás OAuth2 Resource Server-ként működjön,
                // ami dekódolja és érvényesíti a Bearer tokent (JWT-t).
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))

                // Kérés engedélyezések
                .authorizeHttpRequests(auth -> auth
                        // 1. Kiemelten fontos: Engedélyezi a token nélküli OPTIONS (preflight) kéréseket
                        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()

                        // 2. Minden más kérés az /api/** útvonalon hitelesítést igényel
                        .requestMatchers("/api/**").authenticated()

                        // 3. Minden más engedélyezve van
                        .anyRequest().permitAll()
                )
                // Eltávolítottuk a formLogin() és az and() részeket, mivel nem form alapú hitelesítést használunk.
                .build();
    }
}