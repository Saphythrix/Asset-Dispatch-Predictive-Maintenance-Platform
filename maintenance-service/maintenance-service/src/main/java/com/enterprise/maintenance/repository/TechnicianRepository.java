package com.enterprise.maintenance.repository;


import com.enterprise.maintenance.entity.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TechnicianRepository extends JpaRepository<Technician, UUID> {
    List<Technician> findByAvailableTrue();
}