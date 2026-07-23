---
name: database-reviewer
description: Comprehensive database review covering schema design, migrations, performance, data integrity, and queries
---

# Database Code Reviewer

Review database changes including migrations, schema design, queries, indexes, and data integrity.

## Pre-Review Checklist

- [ ] Identify migration files or schema changes
- [ ] Determine database type (SQL, NoSQL, etc.)
- [ ] Identify database changes required
- [ ] Check for rollback/revert capability
- [ ] Review any data transformation scripts
- [ ] Look for query changes in application code

## Migration Safety Checklist

- [ ] Migration is reversible (DOWN/rollback script exists)
- [ ] No breaking changes without coordination
- [ ] Migration name is descriptive
- [ ] Migration timestamp is correct (no conflicts)
- [ ] Safe to run on large tables (doesn't lock for long)
- [ ] Proper indexes added after column creation
- [ ] No data loss in the migration
- [ ] Tested with actual data volume (not just sample)
- [ ] Deployment instructions clear if manual steps needed
- [ ] Zero-downtime deployment strategy (if applicable)

## Schema Design Checklist

- [ ] Tables/collections have clear, descriptive names
- [ ] Column/field names are consistent with project conventions
- [ ] Data types are appropriate for the data
  - [ ] String vs ENUM for fixed values
  - [ ] INT vs BIGINT for numbers (overflow considered)
  - [ ] UUID vs auto-increment for IDs
  - [ ] DateTime for timestamps (not string)
- [ ] Primary keys defined
- [ ] Foreign keys defined and constraints enforced
- [ ] Unique constraints where needed
- [ ] NOT NULL constraints appropriate
- [ ] Default values set correctly
- [ ] No redundant data (normalized appropriately)
- [ ] Audit columns present (created_at, updated_at, deleted_at)
- [ ] Soft delete strategy consistent
- [ ] Partitioning/sharding considered for large tables
- [ ] Archive strategy for old data

## Index Strategy Checklist

- [ ] Indexes added for frequently searched columns
- [ ] Composite indexes created where filtering on multiple columns
- [ ] Foreign key columns indexed
- [ ] No over-indexing (diminishing returns)
- [ ] Index names are descriptive
- [ ] Column order in composite indexes optimized
- [ ] Filtered indexes used for partial data (if supported)
- [ ] Index maintenance plan documented (if needed)
- [ ] Statistics updated after large changes

## Query Performance Checklist

- [ ] No N+1 query problems
- [ ] JOINs properly structured
- [ ] WHERE clauses efficient (index-friendly)
- [ ] ORDER BY uses indexes
- [ ] LIMIT used for large result sets
- [ ] Subqueries/CTEs optimized or pushed to application
- [ ] Unnecessary columns not selected
- [ ] SELECT * avoided in production code
- [ ] Aggregation queries optimized
- [ ] Pagination implemented correctly (offset/cursor)
- [ ] Query explains reviewed for large tables
- [ ] Full-text search configured if needed

## Normalization Checklist

- [ ] Data normalized to appropriate level (3NF typically)
- [ ] Denormalization decisions documented (with rationale)
- [ ] Redundant columns justified for performance
- [ ] Calculated fields not stored (computed on-the-fly)
- [ ] No data duplication unless caching strategy

## Data Integrity Checklist

- [ ] Referential integrity maintained (foreign keys)
- [ ] Constraints prevent invalid data
- [ ] Cascading deletes/updates appropriate
- [ ] Orphaned records not possible
- [ ] Data validation rules consistent with application
- [ ] Transactions ensure atomicity of multi-step operations
- [ ] Duplicate prevention (unique constraints)
- [ ] Data consistency checks passing

## NoSQL Specific (if applicable)

- [ ] Document structure efficient for queries
- [ ] Denormalization strategy clear
- [ ] Indexing strategy defined
- [ ] No unbounded arrays/nested documents
- [ ] Partitioning/sharding plan if needed
- [ ] Time-to-live (TTL) policies configured
- [ ] Backup strategy appropriate
- [ ] Replica set configuration correct

## SQL Specific Checklist

- [ ] Transactions properly used (ACID compliance)
- [ ] Isolation levels appropriate for use case
- [ ] Row-level or column-level security if needed
- [ ] Views created for commonly used queries
- [ ] Stored procedures justified (not overused)
- [ ] Triggers used minimally and well-documented
- [ ] Connection pooling configured
- [ ] Query statistics/execution plans reviewed

## Backup & Recovery Checklist

- [ ] Backup strategy defined and tested
- [ ] Restore procedures documented
- [ ] Point-in-time recovery possible
- [ ] Retention policy clear
- [ ] Critical data replicated
- [ ] Disaster recovery plan exists
- [ ] RTO/RPO metrics defined

## Security Checklist

- [ ] User permissions follow principle of least privilege
- [ ] SQL injection vulnerabilities prevented (parameterized queries)
- [ ] Sensitive data encrypted at rest (PII, passwords)
- [ ] Sensitive data encrypted in transit
- [ ] Access control list (ACL) reviewed
- [ ] Audit logging for data changes
- [ ] Data masking for sensitive fields
- [ ] No hardcoded credentials in migration scripts
- [ ] Secrets properly managed (environment variables)

## Monitoring & Observability Checklist

- [ ] Slow query logging enabled
- [ ] Query performance metrics monitored
- [ ] Table/index size monitoring in place
- [ ] Disk space monitoring configured
- [ ] Replication lag monitored (if applicable)
- [ ] Connection pool exhaustion alerted
- [ ] Lock contention monitored
- [ ] Data quality checks implemented

## Testing Checklist

- [ ] Migration tested in staging environment
- [ ] Migration tested with actual data volume
- [ ] Rollback tested
- [ ] Data transformations validated
- [ ] Schema validation tests pass
- [ ] No tests broken by schema changes
- [ ] Integration tests pass with new schema
- [ ] Performance benchmarks recorded

## Documentation Checklist

- [ ] Migration has clear description/comments
- [ ] Schema diagram updated
- [ ] Data dictionary/schema documentation updated
- [ ] Breaking changes documented
- [ ] Deployment instructions included
- [ ] Rollback instructions clear
- [ ] Access control documentation updated
- [ ] Backup/recovery procedures documented

## Workflow Steps

1. **Understand the change** - Read migration description and related PRs
2. **Review migration file** - Check structure and reversibility
3. **Analyze schema changes** - Verify design and normalization
4. **Check data transformations** - Ensure data integrity
5. **Review indexes** - Verify performance will improve
6. **Examine related queries** - Check for N+1 problems
7. **Verify security** - Check access controls and encryption
8. **Review testing** - Confirm migration is tested
9. **Check documentation** - Ensure schema docs updated
10. **Test migration** - Run in staging if possible
11. **Review rollback** - Verify can revert safely
12. **Provide feedback** - Summarize findings and risks

## Red Flags 🚩

- Migrations that can't be rolled back
- Breaking changes without documentation
- N+1 queries in application code
- Missing indexes on frequently searched columns
- Over-indexing (more maintenance burden than benefit)
- No foreign key constraints (referential integrity lost)
- Soft and hard deletes mixed inconsistently
- Denormalization without performance justification
- Sensitive data stored in plain text
- Large data transformations without testing
- No backup strategy
- Blocking operations on large tables
- Zero analysis of migration impact on production

## Questions to Ask

- How long will this migration take on production data?
- Can we roll this back if something goes wrong?
- Will this impact existing queries/performance?
- Are there any data loss risks?
- Do we need new indexes?
- Is referential integrity maintained?
- How does this scale to larger datasets?
- What's the deployment strategy?

## Tips for Effective Review

- Check the migration size and estimated execution time
- Review the EXPLAIN PLAN for new queries
- Test with realistic data volume
- Verify indexes with slow query logs
- Check for table locks (especially on large tables)
- Confirm backup strategy
- Test rollback procedure
- Monitor query performance after deployment
