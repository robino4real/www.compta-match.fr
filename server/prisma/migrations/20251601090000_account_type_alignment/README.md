# Account type alignment migration checks

Quick verification steps on a populated database to confirm cleanup behavior:

- Rows with `UserProfile.accountType` = NULL are updated to `INDIVIDUAL`.
- Rows with invalid `UserProfile.accountType` values (e.g. `CLIENT`) are also updated to `INDIVIDUAL`.

You can validate after running the migration with:

```sql
SELECT accountType, COUNT(*) FROM "UserProfile" GROUP BY accountType;
```

The result should only list `INDIVIDUAL`, `PROFESSIONAL`, and `ASSOCIATION`.
