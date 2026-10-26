# MoneyManager — Personal Finance App

A full-stack personal finance app: track income and expenses, set monthly budgets per category, and view analytics. The Spring Boot REST API is secured with JWT access tokens, rotating refresh tokens and role-based access control.

**Backend:** Java 17 · Spring Boot 3.4 · Spring Security · Spring Data JPA / Hibernate · PostgreSQL · JJWT · Lombok · JUnit 5 / MockMvc
**Frontend:** React 18 · Vite · Tailwind CSS · TanStack Query · Zustand · React Hook Form + Zod · Recharts
**Infra:** Docker Compose · GitHub Actions CI

## Features

- **Accounts:** register, log in, log out; 15-minute access tokens and 7-day refresh tokens that renew automatically in the background
- **Transactions:** create, edit and delete income and expenses; paginated list filtered by type, category and date range; CSV export
- **Categories:** 12 built-in categories, plus private custom categories per user
- **Budgets:** monthly spending limit per category, with spent vs. limit shown
- **Dashboard and analytics:** monthly income, expenses and savings; yearly report; category breakdown; spending trend
- **Admin panel** (ADMIN role only): platform stats, paginated user list, enable/disable users, change subscription plan

## Security design

| Concern | Implementation |
|---|---|
| Password storage | BCrypt; registration enforces 8+ characters with a letter and a number |
| Authentication | Stateless HS256 JWT in `Authorization: Bearer`. A `OncePerRequestFilter` validates it and reloads the user, so **disabling an account takes effect immediately**, not when the token expires |
| Refresh tokens | 256-bit random tokens; **only their SHA-256 hash is stored**. Each use rotates the token, and **reusing an old one revokes all of that user's sessions** (theft detection) |
| Authorization | `/api/admin/**` needs `ROLE_ADMIN` in the filter chain *and* via `@PreAuthorize` (defense in depth) |
| Data isolation | Every query is scoped to the authenticated user's id. Another user's records return 404, not 403, so their existence isn't leaked. Transactions and budgets can only use built-in categories or the user's own |
| Secrets | JWT secret, DB password and admin credentials come from environment variables. The app refuses to start with a missing or short JWT secret. There are no default accounts |
| Errors | 401/403 return the same JSON shape as every other API error |

These behaviours are covered by integration tests: [`AuthFlowIntegrationTest`](backend/src/test/java/com/moneymanager/security/AuthFlowIntegrationTest.java), [`DataIsolationIntegrationTest`](backend/src/test/java/com/moneymanager/security/DataIsolationIntegrationTest.java) and [`JwtServiceTest`](backend/src/test/java/com/moneymanager/security/JwtServiceTest.java).

## Run it

### Docker Compose
```bash
cp .env.example .env        # then set DB_PASSWORD, APP_JWT_SECRET (openssl rand -hex 32), optional admin login
docker compose up -d --build
```
Frontend: http://localhost:3000 · API: http://localhost:8080

### Manual
```bash
# Backend (needs PostgreSQL with a database named money_manager_db)
cd backend
export DB_PASSWORD=yourpassword APP_JWT_SECRET=$(openssl rand -hex 32)
export APP_ADMIN_EMAIL=admin@example.com APP_ADMIN_PASSWORD=ChangeMe123   # optional
./mvnw spring-boot:run

# Frontend (proxies /api to localhost:8080)
cd frontend && npm install && npm run dev      # http://localhost:5173
```

### Quick try without PostgreSQL
```bash
cd backend
SPRING_PROFILES_ACTIVE=dev APP_JWT_SECRET=$(openssl rand -hex 32) ./mvnw spring-boot:run   # in-memory H2
```

### Tests
```bash
cd backend && ./mvnw test     # 18 tests; uses in-memory H2, no database needed
```

## API

All endpoints except register, login, refresh and logout need `Authorization: Bearer <accessToken>`. Responses use the shape `{ success, message, data, timestamp }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh` · `POST /api/auth/logout` · `GET /api/auth/me` |
| Transactions | `GET /api/transactions?type&categoryId&startDate&endDate&page&size` · `POST` · `GET/PUT/DELETE /api/transactions/{id}` |
| Categories | `GET /api/categories` · `GET /api/categories/predefined` · `POST` · `PUT/DELETE /api/categories/{id}` |
| Budgets | `GET /api/budgets?month&year` · `POST` · `PUT/DELETE /api/budgets/{id}` |
| Dashboard | `GET /api/dashboard` |
| Analytics | `GET /api/analytics/yearly` · `/categories` · `/trend` · `/export/csv?startDate&endDate` |
| Admin | `GET /api/admin/stats` · `GET /api/admin/users` · `PATCH /api/admin/users/{id}/toggle-status` · `PATCH /api/admin/users/{id}/subscription` |

```bash
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"Secret123","firstName":"Asha","lastName":"Verma"}'
```

## Project structure

```
backend/src/main/java/com/moneymanager
├── config/       SecurityConfig, auditing, seed data (categories + optional admin)
├── security/     JwtService, JwtAuthenticationFilter, UserPrincipal, JSON 401/403 handler
├── controller/   REST controllers (current user via @AuthenticationPrincipal)
├── service/      Business logic, incl. AuthService (token issue/rotation) and AdminService
├── repository/   Spring Data JPA repositories
├── model/        JPA entities: User, Transaction, Category, Budget, Subscription, RefreshToken
├── dto/          Validated request objects and response objects
└── exception/    Custom exceptions + global handler
frontend/src
├── store/        Zustand auth store (persisted)
├── lib/axios.js  Attaches the token; on 401 refreshes once (shared across concurrent requests) and retries
├── components/   Layout, route guards (RequireAuth / RequireAdmin), UI kit
├── hooks/        TanStack Query hooks per resource
└── pages/        Login, Register, Dashboard, Transactions, Budgets, Categories, Analytics, Admin
```

## Roadmap

- Flyway migrations instead of `ddl-auto=update`
- Stripe checkout for the BASIC and PREMIUM plans (the subscription table already has the Stripe id columns)
- Rate limiting on login
- Refresh token in an httpOnly cookie instead of local storage

## Author

**Ashish Menaria**: [GitHub](https://github.com/ashishmenariaa) · [LinkedIn](https://www.linkedin.com/in/ashish-menaria-6593511a7/)
