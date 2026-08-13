package com.enterprise.auth_service.Services;



import com.enterprise.auth_service.Dto.AuthResponse;
import com.enterprise.auth_service.Dto.LoginRequest;
import com.enterprise.auth_service.Dto.RegisterRequest;
import com.enterprise.auth_service.Entity.ClientCompany;
import com.enterprise.auth_service.Entity.UserAccount;
import com.enterprise.auth_service.Repositories.ClientCompanyRepository;
import com.enterprise.auth_service.Repositories.UserAccountRepository;
import com.enterprise.auth_service.Security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository userRepository;
    private final ClientCompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional //Treat everything inside this method as one database transaction.
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        // Fetch or create tenant company
        ClientCompany company = companyRepository.findByName(request.getCompanyName())
                .orElseGet(() -> companyRepository.save(
                        ClientCompany.builder()
                                .name(request.getCompanyName())
                                .billingTier(request.getBillingTier())
                                .build()
                ));

        // Create user
        UserAccount user = UserAccount.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .clientCompany(company)
                .role(request.getRole())
                .build();

        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .companyId(company.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        UserAccount user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .companyId(user.getClientCompany().getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
