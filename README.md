# B2B Asset Dispatch & Predictive Maintenance Platform (Microservices)

An enterprise-grade microservice platform for industrial asset dispatching, real-time concurrency handling, and predictive maintenance scheduling.

## System Architecture
- **Service Registry:** Eureka Server (Port 8761)
- **API Gateway:** Spring Cloud Gateway (Port 8080)
- **Auth Service:** Spring Security + JWT (Port 8081)
- **Fleet Management:** Spring Data JPA + Redis (Port 8082)
- **Booking Engine:** Pessimistic Locking + Concurrency Control (Port 8083)
- **Maintenance Service:** Asynchronous State Machine + Kafka (Port 8084)