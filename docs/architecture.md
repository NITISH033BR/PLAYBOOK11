# IPL Betting Platform — Architecture Document

## 1. PROJECT OVERVIEW

A full-stack sports betting platform with real-time odds, multi-bet support, wallet management, admin analytics, and a referral system. Built with Next.js (frontend), NestJS (backend), PostgreSQL, Redis, and Docker.

---

## 2. MONOREPO STRUCTURE

```
/ipl
├── docker/
│   ├── postgres/
│   │   └── init.sql
│   └── redis/
│       └── redis.conf
├── docker-compose.yml
├── package.json                    # Workspace root
├── packages/
│   └── shared/                     # Shared types and constants
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── auth.types.ts
│           │   ├── wallet.types.ts
│           │   ├── betting.types.ts
│           │   ├── sport.types.ts
│           │   └── common.types.ts
│           └── constants/
│               ├── roles.ts
│               ├── status.ts
│               └── errors.ts
├── apps/
│   ├── frontend/                   # Next.js application
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── next.config.ts
│   │   ├── public/
│   │   ├── .env
│   │   └── src/
│   │       ├── app/                # App Router pages
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx        # Home
│   │       │   ├── login/
│   │       │   ├── register/
│   │       │   ├── sports/
│   │       │   ├── match/
│   │       │   ├── wallet/
│   │       │   ├── profile/
│   │       │   ├── admin/
│   │       │   └── leaderboard/
│   │       ├── components/
│   │       │   ├── ui/             # Reusable primitives
│   │       │   ├── layout/         # Header, Footer, Sidebar, Nav
│   │       │   ├── betting/        # BetSlip, OddsButton, BetCard
│   │       │   ├── wallet/         # DepositForm, WithdrawForm, Balance
│   │       │   ├── sports/         # SportList, MatchList, MatchCard
│   │       │   ├── admin/          # UserTable, MatchManager, OddsEditor
│   │       │   └── auth/           # LoginForm, RegisterForm, ProtectedRoute
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   ├── useWallet.ts
│   │       │   ├── useBets.ts
│   │       │   ├── useSports.ts
│   │       │   └── useAdmin.ts
│   │       ├── lib/
│   │       │   ├── api.ts          # Axios/fetch client
│   │       │   ├── query.ts        # React Query config
│   │       │   └── utils.ts
│   │       ├── store/
│   │       │   ├── authStore.ts    # Zustand
│   │       │   ├── betSlipStore.ts
│   │       │   └── uiStore.ts
│   │       └── middleware.ts       # NextAuth/redirect logic
│   │
│   └── backend/                    # NestJS application
│       ├── package.json
│       ├── tsconfig.json
│       ├── nest-cli.json
│       ├── .env
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── common/
│           │   ├── decorators/
│           │   │   ├── current-user.decorator.ts
│           │   │   └── roles.decorator.ts
│           │   ├── guards/
│           │   │   ├── jwt-auth.guard.ts
│           │   │   └── roles.guard.ts
│           │   ├── interceptors/
│           │   │   ├── logging.interceptor.ts
│           │   │   └── transform.interceptor.ts
│           │   ├── filters/
│           │   │   └── http-exception.filter.ts
│           │   ├── pipes/
│           │   │   └── validation.pipe.ts
│           │   └── dto/
│           │       └── pagination.dto.ts
│           ├── modules/
│           │   ├── auth/
│           │   │   ├── auth.module.ts
│           │   │   ├── auth.controller.ts
│           │   │   ├── auth.service.ts
│           │   │   ├── dto/
│           │   │   │   ├── register.dto.ts
│           │   │   │   ├── login.dto.ts
│           │   │   │   └── reset-password.dto.ts
│           │   │   └── strategies/
│           │   │       ├── jwt.strategy.ts
│           │   │       └── jwt-refresh.strategy.ts
│           │   ├── users/
│           │   │   ├── users.module.ts
│           │   │   ├── users.controller.ts
│           │   │   ├── users.service.ts
│           │   │   └── dto/
│           │   ├── wallet/
│           │   │   ├── wallet.module.ts
│           │   │   ├── wallet.controller.ts
│           │   │   ├── wallet.service.ts
│           │   │   └── dto/
│           │   │       ├── deposit.dto.ts
│           │   │       └── withdraw.dto.ts
│           │   ├── sports/
│           │   │   ├── sports.module.ts
│           │   │   ├── sports.controller.ts
│           │   │   ├── sports.service.ts
│           │   │   └── dto/
│           │   ├── matches/
│           │   │   ├── matches.module.ts
│           │   │   ├── matches.controller.ts
│           │   │   ├── matches.service.ts
│           │   │   └── dto/
│           │   ├── betting/
│           │   │   ├── betting.module.ts
│           │   │   ├── betting.controller.ts
│           │   │   ├── betting.service.ts
│           │   │   ├── settlement.service.ts
│           │   │   └── dto/
│           │   │       ├── place-bet.dto.ts
│           │   │       └── settle.dto.ts
│           │   ├── referral/
│           │   │   ├── referral.module.ts
│           │   │   ├── referral.controller.ts
│           │   │   ├── referral.service.ts
│           │   │   └── dto/
│           │   ├── leaderboard/
│           │   │   ├── leaderboard.module.ts
│           │   │   ├── leaderboard.controller.ts
│           │   │   └── leaderboard.service.ts
│           │   ├── notifications/
│           │   │   ├── notifications.module.ts
│           │   │   ├── notifications.controller.ts
│           │   │   ├── notifications.service.ts
│           │   │   └── dto/
│           │   ├── admin/
│           │   │   ├── admin.module.ts
│           │   │   ├── admin.controller.ts
│           │   │   ├── admin.service.ts
│           │   │   └── dto/
│           │   └── analytics/
│           │       ├── analytics.module.ts
│           │       ├── analytics.controller.ts
│           │       ├── analytics.service.ts
│           │       └── dto/
│           └── prisma/
│               ├── prisma.module.ts
│               ├── prisma.service.ts
│               └── schema.prisma
│
└── docs/
    └── architecture.md
```

---

## 3. DATABASE DESIGN (Prisma Schema)

### 3.1 Entity-Relationship Summary

```
User ──── Wallet ──── Transaction
  │                      │
  │                      └── LedgerEntry
  │
  ├── Bet ────────── BetLeg ──── Market (Odds)
  │     │
  │     └── BetHistory
  │
  ├── Referral (referredBy)
  │
  ├── Notification
  │
  └── RefreshToken

Sport ──── League ──── Team
                         │
Match ───────────────────┘
  │
  └── Market ──── Odds
       │
       └── BetLeg
```

### 3.2 Tables

#### User
| Column        | Type     | Notes                  |
|---------------|----------|------------------------|
| id            | UUID     | PK                     |
| email         | String   | Unique, indexed        |
| username      | String   | Unique                 |
| passwordHash  | String   | bcrypt                 |
| displayName   | String   |                        |
| role          | Enum     | USER, ADMIN, SUPER_ADMIN |
| referredById  | UUID?    | FK -> User             |
| referralCode  | String   | Unique                 |
| isActive      | Boolean  | Default true            |
| createdAt     | DateTime |                        |
| updatedAt     | DateTime |                        |

#### RefreshToken
| Column    | Type     | Notes           |
|-----------|----------|-----------------|
| id        | UUID     | PK              |
| userId    | UUID     | FK -> User      |
| token     | String   | Hashed          |
| expiresAt | DateTime |                 |
| createdAt | DateTime |                 |

#### Wallet
| Column   | Type         | Notes      |
|----------|--------------|------------|
| id       | UUID         | PK         |
| userId   | UUID         | FK, Unique |
| balance  | Decimal(12,2)| Default 0  |
| bonus    | Decimal(12,2)| Default 0  |
| locked   | Decimal(12,2)| Default 0  |
| version  | Int          | Optimistic locking |
| createdAt| DateTime     |            |
| updatedAt| DateTime     |            |

#### Transaction
| Column      | Type         | Notes                |
|-------------|--------------|----------------------|
| id          | UUID         | PK                   |
| walletId    | UUID         | FK -> Wallet         |
| userId      | UUID         | FK -> User           |
| type        | Enum         | DEPOSIT, WITHDRAWAL, BET_PLACED, BET_WON, BET_LOST, REFERRAL_BONUS, ADMIN_ADJUST |
| amount      | Decimal(12,2)|                      |
| balanceBefore| Decimal(12,2)|                     |
| balanceAfter| Decimal(12,2)|                      |
| status      | Enum         | PENDING, COMPLETED, FAILED, CANCELLED |
| reference   | String?      | External reference   |
| description | String?      |                      |
| createdAt   | DateTime     |                      |

#### Sport
| Column | Type   | Notes |
|--------|--------|-------|
| id     | UUID   | PK    |
| name   | String | Unique |
| slug   | String | Unique |
| icon   | String?|       |
| active | Boolean|       |

#### League
| Column   | Type   | Notes      |
|----------|--------|------------|
| id       | UUID   | PK         |
| sportId  | UUID   | FK -> Sport|
| name     | String |            |
| country  | String?|            |
| logo     | String?|            |

#### Team
| Column   | Type   | Notes      |
|----------|--------|------------|
| id       | UUID   | PK         |
| name     | String |            |
| shortName| String?|            |
| logo     | String?|            |
| sportId  | UUID   | FK -> Sport|

#### Match
| Column     | Type     | Notes                 |
|------------|----------|-----------------------|
| id         | UUID     | PK                    |
| leagueId   | UUID     | FK -> League          |
| homeTeamId | UUID     | FK -> Team            |
| awayTeamId | UUID     | FK -> Team            |
| startTime  | DateTime |                       |
| status     | Enum     | SCHEDULED, LIVE, FINISHED, CANCELLED, POSTPONED |
| homeScore  | Int?     |                       |
| awayScore  | Int?     |                       |
| createdAt  | DateTime |                       |
| updatedAt  | DateTime |                       |

#### Market
| Column   | Type     | Notes                        |
|----------|----------|------------------------------|
| id       | UUID     | PK                           |
| matchId  | UUID     | FK -> Match                  |
| name     | String   | e.g. "Match Winner", "Over/Under 2.5" |
| type     | Enum     | WIN_DRAW_WIN, OVER_UNDER, BOTH_TEAMS_SCORE, HANDICAP, CORRECT_SCORE |
| status   | Enum     | OPEN, SUSPENDED, SETTLED     |
| createdAt| DateTime |                              |

#### Odds
| Column    | Type         | Notes      |
|-----------|--------------|------------|
| id        | UUID         | PK         |
| marketId  | UUID         | FK -> Market |
| label     | String       | e.g. "Home", "Away", "Over 2.5" |
| value     | Decimal(8,2) | Decimal odds (e.g. 2.50) |
| active    | Boolean      | Default true |

#### Bet
| Column     | Type         | Notes                   |
|------------|--------------|-------------------------|
| id         | UUID         | PK                      |
| userId     | UUID         | FK -> User              |
| type       | Enum         | SINGLE, MULTI           |
| stake      | Decimal(12,2)|                         |
| totalOdds  | Decimal(8,2) | Combined odds           |
| potentialWin| Decimal(12,2)|                        |
| status     | Enum         | PENDING, WON, LOST, CANCELLED, CASHED_OUT |
| cashoutAmount| Decimal(12,2)? |                      |
| createdAt  | DateTime     |                         |
| settledAt  | DateTime?    |                         |

#### BetLeg
| Column   | Type         | Notes           |
|----------|--------------|-----------------|
| id       | UUID         | PK              |
| betId    | UUID         | FK -> Bet       |
| marketId | UUID         | FK -> Market    |
| oddsId   | UUID         | FK -> Odds      |
| oddsValue| Decimal(8,2) | Snapshot at time of bet |
| status   | Enum         | PENDING, WON, LOST, VOID |
| settledAt| DateTime?    |                 |

#### Referral
| Column      | Type     | Notes           |
|-------------|----------|-----------------|
| id          | UUID     | PK              |
| referrerId  | UUID     | FK -> User      |
| referredId  | UUID     | FK -> User      |
| commissionEarned | Decimal(12,2) | Default 0 |
| createdAt   | DateTime |                 |

#### Notification
| Column  | Type     | Notes           |
|---------|----------|-----------------|
| id      | UUID     | PK              |
| userId  | UUID     | FK -> User      |
| title   | String   |                 |
| message | String   |                 |
| type    | Enum     | BET_SETTLED, DEPOSIT, WITHDRAWAL, PROMOTION, SYSTEM |
| read    | Boolean  | Default false    |
| createdAt | DateTime |                 |

#### AuditLog
| Column   | Type     | Notes         |
|----------|----------|---------------|
| id       | UUID     | PK            |
| userId   | UUID?    | FK -> User    |
| action   | String   |               |
| entity   | String   |               |
| entityId | String?  |               |
| metadata | JSON?    |               |
| ip       | String?  |               |
| createdAt| DateTime |               |

---

## 4. API DESIGN

### 4.1 Base URL
- Development: `http://localhost:4000/api/v1`
- Production: `https://api.ipl-betting.com/api/v1`

### 4.2 Authentication Endpoints

| Method | Path                    | Auth     | Description          |
|--------|-------------------------|----------|----------------------|
| POST   | /auth/register          | Public   | Register new user    |
| POST   | /auth/login             | Public   | Login, get tokens    |
| POST   | /auth/refresh           | Public   | Refresh access token |
| POST   | /auth/logout            | Auth     | Revoke refresh token |
| POST   | /auth/forgot-password   | Public   | Send reset email     |
| POST   | /auth/reset-password    | Public   | Reset password       |
| GET    | /auth/me                | Auth     | Get current user     |

### 4.3 User Endpoints

| Method | Path            | Auth     | Role  | Description          |
|--------|-----------------|----------|-------|----------------------|
| GET    | /users/profile  | Auth     | Any   | Get own profile      |
| PATCH  | /users/profile  | Auth     | Any   | Update profile       |
| GET    | /users/:id      | Auth     | ADMIN | Get any user         |
| GET    | /users          | Auth     | ADMIN | List users           |

### 4.4 Wallet Endpoints

| Method | Path                    | Auth     | Description              |
|--------|-------------------------|----------|--------------------------|
| GET    | /wallet                 | Auth     | Get wallet balance       |
| POST   | /wallet/deposit         | Auth     | Create deposit           |
| POST   | /wallet/withdraw        | Auth     | Create withdrawal        |
| GET    | /wallet/transactions    | Auth     | Transaction history      |
| GET    | /wallet/transactions/:id| Auth     | Transaction detail       |

### 4.5 Sports & Matches Endpoints

| Method | Path                              | Auth     | Description        |
|--------|-----------------------------------|----------|--------------------|
| GET    | /sports                           | Public   | List sports        |
| GET    | /sports/:slug/leagues             | Public   | List leagues       |
| GET    | /sports/:slug/matches             | Public   | List matches       |
| GET    | /matches                          | Public   | List all matches   |
| GET    | /matches/:id                      | Public   | Match detail + markets |
| GET    | /matches/:id/markets              | Public   | Markets for match  |
| PATCH  | /matches/:id/status               | Auth     | ADMIN: Update score/status |

### 4.6 Betting Endpoints

| Method | Path                    | Auth     | Description          |
|--------|-------------------------|----------|----------------------|
| POST   | /bets                   | Auth     | Place a bet          |
| GET    | /bets                   | Auth     | Bet history (own)    |
| GET    | /bets/:id               | Auth     | Bet detail           |
| GET    | /bets/active            | Auth     | Active bets          |
| POST   | /bets/:id/cashout       | Auth     | Cash out early       |

### 4.7 Referral Endpoints

| Method | Path                      | Auth     | Description          |
|--------|---------------------------|----------|----------------------|
| GET    | /referrals                | Auth     | Get referral stats   |
| GET    | /referrals/code           | Auth     | Get referral code    |
| GET    | /referrals/history        | Auth     | Referral history     |

### 4.8 Leaderboard Endpoints

| Method | Path            | Auth     | Description          |
|--------|-----------------|----------|----------------------|
| GET    | /leaderboard    | Public   | Top bettors          |
| GET    | /leaderboard/weekly | Public | Weekly rankings    |

### 4.9 Notification Endpoints

| Method | Path                            | Auth     | Description            |
|--------|---------------------------------|----------|------------------------|
| GET    | /notifications                  | Auth     | Get notifications      |
| PATCH  | /notifications/:id/read         | Auth     | Mark as read           |
| PATCH  | /notifications/read-all         | Auth     | Mark all as read       |

### 4.10 Admin Endpoints

| Method | Path                    | Auth     | Description          |
|--------|-------------------------|----------|----------------------|
| GET    | /admin/dashboard        | Auth     | ADMIN: Dashboard stats |
| GET    | /admin/users            | Auth     | ADMIN: Manage users  |
| PATCH  | /admin/users/:id/status | Auth     | ADMIN: Suspend/activate |
| POST   | /admin/matches          | Auth     | ADMIN: Create match  |
| PATCH  | /admin/matches/:id      | Auth     | ADMIN: Update match  |
| POST   | /admin/matches/:id/markets | Auth  | ADMIN: Add market    |
| PATCH  | /admin/odds/:id         | Auth     | ADMIN: Update odds   |
| GET    | /admin/transactions     | Auth     | ADMIN: All transactions |

### 4.11 Analytics Endpoints

| Method | Path                          | Auth     | Description            |
|--------|-------------------------------|----------|------------------------|
| GET    | /analytics/overview           | Auth     | ADMIN: Key metrics     |
| GET    | /analytics/revenue            | Auth     | ADMIN: Revenue stats   |
| GET    | /analytics/users              | Auth     | ADMIN: User analytics  |
| GET    | /analytics/bets               | Auth     | ADMIN: Bet analytics   |

---

## 5. AUTHENTICATION FLOW

```
Register:  POST /auth/register → hash password → create user → create wallet → return tokens
Login:     POST /auth/login → verify password → generate access + refresh tokens → return
Refresh:   POST /auth/refresh → verify refresh token → rotate → new access token
Logout:    POST /auth/logout → invalidate refresh token
```

- Access token: JWT, 15-minute expiration
- Refresh token: JWT, 7-day expiration, stored in DB (hashed)
- Passwords: bcrypt, 12 salt rounds
- Roles: USER, ADMIN, SUPER_ADMIN (guards on endpoints)

---

## 6. WALLET & TRANSACTION FLOW

```
Deposit:
  POST /wallet/deposit → create Transaction(PENDING) → confirm → update Wallet(balance += amount)
    → create LedgerEntry → Transaction(COMPLETED)

Withdrawal:
  POST /wallet/withdraw → validate balance → create Transaction(PENDING)
    → process (manual/auto) → update Wallet(balance -= amount) → Transaction(COMPLETED)

Bet Placed:
  placeBet → validate balance → lock stake amount → create Bet(PENDING)
    → Transaction(BET_PLACED, PENDING)

Bet Settled:
  settlement.run → for each winning bet: wallet.balance += winAmount
    → Transaction(BET_WON, COMPLETED)
  for each losing bet: wallet.locked -= stake → Transaction(BET_LOST, COMPLETED)

Optimistic locking on Wallet (version field) prevents race conditions.
```

---

## 7. BETTING ENGINE

### 7.1 Bet Types

- **Single**: One selection on one market. Odds = selection odds.
- **Multi (Accumulator)**: 2+ selections across any markets/matches. Odds = product of all selection odds. All must win.

### 7.2 Settlement Engine

```
For each settled market:
  For each BetLeg linked to this market:
    - If selection wins → BetLeg(WON)
    - If selection loses → BetLeg(LOST)
    - If market void → BetLeg(VOID)

  For each Bet linked to these legs:
    - SINGLE: Bet status = leg status (WON/LOST/VOID → refund)
    - MULTI: All legs WON → Bet(WON). Any LOST → Bet(LOST). Any VOID → recalculate
```

### 7.3 Cash Out

- Calculate current cash-out value based on live odds
- User accepts → bet settled at cash-out amount (less than potential win)

---

## 8. FRONTEND STATE MANAGEMENT

### Zustand Stores

1. **authStore**: user, tokens, isAuthenticated, login, logout, refreshToken
2. **betSlipStore**: selections[], addSelection, removeSelection, clear, stake, type (single/multi)
3. **uiStore**: theme, sidebarOpen, notificationCount

### React Query

- All API data fetching via React Query
- Cache invalidation on mutations
- Stale time: matches/odds (30s), wallet (15s), bets (10s)

---

## 9. INFRASTRUCTURE

### Docker Services

| Service    | Image             | Port  | Notes              |
|------------|-------------------|-------|---------------------|
| postgres   | postgres:16-alpine | 5432  | Persistent volume   |
| redis      | redis:7-alpine     | 6379  | Sessions, cache     |
| backend    | node:20-slim       | 4000  | NestJS app          |
| frontend   | node:20-slim       | 3000  | Next.js app         |
| nginx      | nginx:alpine       | 80/443| Reverse proxy       |

### Redis Usage

- JWT blacklist (logout)
- Rate limiting
- Match odds cache
- Leaderboard cache (sorted sets)

---

## 10. FEATURE ROADMAP

| Phase | Features                              |
|-------|---------------------------------------|
| P1    | Architecture & Planning               |
| P2    | Project Setup (Docker, Prisma, apps)  |
| P3    | Database Schema & Migrations          |
| P4    | Auth (Register, Login, JWT, Roles)    |
| P5    | Wallet System (Deposit, Withdraw)     |
| P6    | Betting Engine (Place, Settle, Cashout) |
| P7    | Frontend UI (Pages, Components, Slip)  |
| P8    | Admin Panel (Management, Analytics)   |
| P9    | Testing (Unit, Integration, Coverage) |
| P10   | Deployment (Docker, Monitoring, Docs) |

---

## 11. DEVELOPMENT ROADMAP

1. **Phase 1**: Architecture document (this file) — DONE
2. **Phase 2**: Scaffold NestJS backend + Next.js frontend, Docker Compose, Prisma init
3. **Phase 3**: Define and run Prisma migrations
4. **Phase 4**: Implement auth modules, guards, JWT strategies
5. **Phase 5**: Wallet module, transaction processing, ledger
6. **Phase 6**: Betting models, odds management, settlement
7. **Phase 7**: All frontend pages, betting slip, responsive design
8. **Phase 8**: Admin panel with full CRUD + analytics dashboard
9. **Phase 9**: Test suites, CI integration
10. **Phase 10**: Production deployment, documentation
