# Spec: Account, Social, Moderation, and Leaderboard

## Objective

Hoàn thiện bốn lát chức năng đang thiếu: quản lý tài khoản và avatar, báo cáo người chơi với moderation inbox, quy trình bạn bè có lời mời rõ ràng, và bảng xếp hạng Top 20.

## Tech Stack

- Server: Node.js, Express, Mongoose, JWT, bcrypt, Socket.io.
- Client: React 18, Vite, Tailwind CSS, Socket.io client.
- Email: SMTP cấu hình bằng biến môi trường; development có thể nhận reset URL trong response để kiểm thử cục bộ.

## Commands

- Server tests: `cd server && npm test`
- Client tests: `cd client && npm test`
- Client build: `cd client && npm run build`
- Dependency audit: `cd server && npm audit --omit=dev`

## Project Structure

- `server/routes/`: HTTP contracts.
- `server/services/`: validation and business rules.
- `server/models/`: persistent state.
- `server/sockets/`: room invitation delivery.
- `client/src/pages/`: player and admin screens.
- `client/src/pages/admin/`: moderation inbox.
- `server/test/`, `client/test/`: regression and contract tests.

## Code Style

```js
if (!ALLOWED_VALUES.has(value)) {
  throw new ApiError(422, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.');
}
```

Reuse existing middleware, API envelopes, admin permissions, and visual language. Prefer small services with route adapters over new framework abstractions.

## Testing Strategy

- Unit tests for validation, token hashing/expiry, report-case grouping, and leaderboard projection.
- Local HTTP tests for authentication and protected endpoint behavior.
- Client contract tests for navigation and required UI actions.
- Full server/client suites, production build, and browser smoke tests at completion.

## Boundaries

- Always: validate identifiers and text lengths server-side; hash reset tokens; return generic forgot-password responses; authorize admin inbox actions; preserve old API routes.
- Ask first: changing email provider or adding third-party file storage.
- Never: return reset tokens in production, accept arbitrary avatar URLs/data URLs, expose hidden rating fields outside leaderboard projection, or let reporters moderate cases.

## Success Criteria

- Authenticated users can edit username/avatar, change password, request a reset, and reset once with an unexpired token.
- Avatar accepts only the six supported preset keys or empty value and propagates into profile/game state.
- A player can report another authenticated player; the report is attached to an open moderation case.
- Admins can filter cases, inspect reports, assign themselves, add notes, and change case status with audit records.
- Users can search players, send/accept/decline requests, list/remove friends, and invite accepted friends into a waiting room.
- Invited online friends receive a room invitation and can join from the client.
- Public Top 20 returns deterministic rank, username, avatar, rating, wins, losses, games, and win rate.
- README documents only implemented leaderboard behavior and the new environment variables.

## Decisions

- Password reset expires after 15 minutes and invalidates refresh sessions after use.
- Development may return `resetUrl`; production sends via configured SMTP and never exposes the token.
- Leaderboard ordering is matchmaking rating descending, then wins descending, then stable user id.
- Uploaded/custom avatar images remain out of scope until owned object storage and image validation exist.
