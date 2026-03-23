# Database Connection Troubleshooting Guide

## Current Status
- **Error**: "getaddrinfo ENOTFOUND ep-still-dream-an6ysd5h-pooler.c-6.us-east-1.aws.neon.tech"
- **Cause**: Neon database/project appears to be deleted or suspended

## IMMEDIATE ACTION REQUIRED

### Your Neon Database Appears to be Unavailable

The hostname `ep-still-dream-an6ysd5h-pooler.c-6.us-east-1.aws.neon.tech` cannot be resolved, which means:

1. ❌ **Neon project was deleted**
2. ❌ **Database was suspended** (billing issue)
3. ❌ **Connection string is outdated**

### Steps to Fix:

#### 1. Check Your Neon Console
- [ ] Go to: https://console.neon.tech/
- [ ] Check if your project still exists
- [ ] If deleted: Create a new project
- [ ] If suspended: Check billing/upgrade plan

#### 2. Create New Neon Project (if needed)
- [ ] Click "Create Project"
- [ ] Choose region (preferably US East)
- [ ] Select PostgreSQL version
- [ ] Create project

#### 3. Get Fresh Connection String
- [ ] In Neon dashboard → Select your project
- [ ] Click "Connection String"
- [ ] Copy the **pooled connection** string
- [ ] Update both `.env` and `.env.local` files:

```env
DATABASE_URL='postgresql://neondb_owner:NEW_PASSWORD@ep-new-project-hash-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

#### 4. Initialize Database
```bash
npm run db:push
```

#### 5. Test Connection
```bash
npm run dev
```
Then visit: http://localhost:3000/api/health

## Alternative: Use Local PostgreSQL
If you prefer local development:

```bash
# Install PostgreSQL locally
# Update .env files with local connection:
DATABASE_URL='postgresql://username:password@localhost:5432/trackr'
```

## Common Neon Issues

| Issue | Solution |
|-------|----------|
| "Compute not available" | Wait 2-3 minutes, retry |
| "ENOTFOUND hostname" | Project deleted - create new one |
| "Authentication failed" | Regenerate password in console |
| "Connection timeout" | Check firewall/proxy settings |

## If Still Failing
1. Delete existing Neon project
2. Create brand new project
3. Use fresh connection string
4. Run `npm run db:push`
5. Test with health endpoint
