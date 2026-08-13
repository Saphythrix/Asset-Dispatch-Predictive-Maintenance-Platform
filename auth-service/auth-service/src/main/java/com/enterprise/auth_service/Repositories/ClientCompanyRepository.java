package com.enterprise.auth_service.Repositories;



import com.enterprise.auth_service.Entity.ClientCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ClientCompanyRepository extends JpaRepository<ClientCompany, UUID> {
    Optional<ClientCompany> findByName(String name);
}