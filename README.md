# B2B Asset Dispatch & Predictive Maintenance Platform

An enterprise-grade, distributed microservices platform designed for leasing high-value industrial machinery, concurrency-safe dispatching, and automated predictive maintenance scheduling.

## System Architecture

- **API Gateway (8080):** Centralized routing, rate limiting, and edge JWT authorization.
- **Service Registry (8761):** Dynamic service discovery using Spring Cloud Netflix Eureka.
- **Auth Service (8081):** Multi-tenant identity management, BCrypt hashing, and JWT token issuance.
- **Fleet Service (8082):** Equipment catalog with Redis caching for sub-millisecond query latency.
- **Booking Engine (8083):** Concurrency-safe reservations using Pessimistic Read Locking and OpenFeign inter-service calls.
- **Maintenance & Dispatch Service (8084):** Background task scheduling (`@Scheduled`) and deterministic Work Order State Machine.

---

## Tech Stack

- **Backend:** Java 17, Spring Boot 3.x, Spring Cloud (Gateway, Eureka, OpenFeign, Resilience4j)
- **Persistence & Caching:** PostgreSQL (Database-per-service pattern), Redis
- **Security:** Spring Security, JWT (io.jsonwebtoken)
- **DevOps & Testing:** Docker, Docker Compose, Postman

---

## Quick Start (Single Command Launch)

### Prerequisites
- Docker & Docker Compose installed

### Execution
```bash
git clone [https://github.com/YOUR_USERNAME/asset-dispatch-platform.git](https://github.com/YOUR_USERNAME/asset-dispatch-platform.git)
cd asset-dispatch-platform
docker compose up --buildtate Machine + Kafka (Port 8084)