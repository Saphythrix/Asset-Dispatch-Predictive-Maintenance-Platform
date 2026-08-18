package com.enterprise.maintenance.entity;



import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "technicians")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Technician {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String skillTags;

    @Column(nullable = false)
    private boolean available;
}
