---
name: backend-reviewer
description: Comprehensive backend code review covering API design, error handling, security, and code quality
---

# Backend Code Reviewer

Review backend code changes for API design, business logic, error handling, security, and maintainability.

## Pre-Review Checklist

- [ ] Identify files changed (controllers, services, routes, middleware, utils)
- [ ] Determine language/framework (Node.js, Python, Go, Java, etc.)
- [ ] Look for new dependencies added
- [ ] Check for environment variable changes needed
- [ ] Review database migration if applicable
- [ ] Identify all API endpoints changed or added

## API Design Checklist

- [ ] REST principles followed (or GraphQL conventions if used)
- [ ] HTTP methods correct (GET/POST/PUT/DELETE/PATCH)
- [ ] Status codes appropriate (200, 201, 400, 401, 403, 404, 500)
- [ ] Request/response schemas well-defined
- [ ] Error responses consistent format
- [ ] API documentation updated
- [ ] Versioning considered if breaking changes
- [ ] Rate limiting implemented if needed
- [ ] Pagination implemented for list endpoints
- [ ] Filtering and sorting supported appropriately

## Business Logic Checklist

- [ ] Logic is correct and handles edge cases
- [ ] No business logic in controllers (moved to services)
- [ ] Transaction handling for multi-step operations
- [ ] Idempotency considered for critical operations
- [ ] Side effects properly managed
- [ ] Complex algorithms have comments explaining the approach
- [ ] Business rules validated at appropriate layers
- [ ] Scheduled jobs or async tasks properly handled

## Error Handling Checklist

- [ ] All errors caught and handled gracefully
- [ ] Proper error logging with context
- [ ] User-facing error messages are helpful but don't leak internals
- [ ] No silent failures or swallowing of errors
- [ ] Retry logic for transient failures
- [ ] Circuit breakers for external service calls
- [ ] Timeout handling for long-running operations
- [ ] Validation errors return 400 with details
- [ ] Auth errors return 401
- [ ] Permission errors return 403
- [ ] Not found errors return 404

## Security Checklist

- [ ] No hardcoded secrets or credentials
- [ ] SQL injection prevention (parameterized queries)
- [ ] Authentication required on protected endpoints
- [ ] Authorization checks (user can only access their own data)
- [ ] HTTPS enforced (redirects from HTTP)
- [ ] CORS properly configured
- [ ] Rate limiting to prevent abuse
- [ ] Input validation and sanitization
- [ ] No information disclosure in error messages
- [ ] Sensitive data not logged
- [ ] Dependencies checked for known vulnerabilities
- [ ] CSRF tokens if applicable
- [ ] Secure password handling (hashing, salting)
- [ ] Secure session management

## Code Quality Checklist

- [ ] Functions are single-responsibility and focused
- [ ] Methods are reasonably sized (<50 lines preferred)
- [ ] Naming is clear and descriptive
- [ ] Complex logic is extracted to separate functions
- [ ] No code duplication (DRY principle)
- [ ] Consistent code style with project
- [ ] Comments explain WHY, not WHAT
- [ ] No debug code or console.log left in
- [ ] Proper use of constants instead of magic numbers/strings
- [ ] Type hints/annotations used (TypeScript, Python typing, etc.)

## Performance Checklist

- [ ] No N+1 query problems
- [ ] Database queries optimized (proper indexes, joins)
- [ ] Unnecessary database calls eliminated
- [ ] Large responses paginated
- [ ] Caching used appropriately
- [ ] Batch operations used when applicable
- [ ] Connection pooling configured
- [ ] No blocking operations in request handlers
- [ ] Async/await used correctly (not blocking)
- [ ] Memory leaks avoided

## Testing Checklist

- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] Edge cases and error paths tested
- [ ] Mocking external services appropriately
- [ ] Tests are not flaky
- [ ] Test coverage adequate for critical paths
- [ ] Happy path and unhappy path both tested
- [ ] Performance tests for critical operations

## Database Checklist

- [ ] Migrations properly written and reversible
- [ ] Indexes added for frequently queried fields
- [ ] Foreign keys and constraints defined
- [ ] No N+1 queries
- [ ] Soft deletes or hard deletes appropriate
- [ ] Data types chosen correctly (string vs int for ID)
- [ ] Default values set appropriately

## Logging & Monitoring Checklist

- [ ] Appropriate log levels used (DEBUG, INFO, WARN, ERROR)
- [ ] Structured logging format used
- [ ] Errors logged with full context
- [ ] PII not logged
- [ ] Request IDs/tracing IDs used
- [ ] Metrics instrumented for critical operations
- [ ] Alerts configured for error rates

## Documentation Checklist

- [ ] README updated if setup changes
- [ ] API documentation updated
- [ ] Complex algorithms documented
- [ ] Environment variables documented
- [ ] Breaking changes documented
- [ ] Migration instructions included if needed

## Workflow Steps

1. **Understand the change** - Read commit message and PR description
2. **Scan file changes** - Look at which files were modified
3. **Review API changes** - Check new endpoints and changes to existing ones
4. **Check business logic** - Ensure correctness and edge case handling
5. **Audit error handling** - Verify errors are caught and handled
6. **Verify security** - Check auth, authorization, and input validation
7. **Examine database changes** - Review migrations and queries
8. **Check testing** - Verify adequate test coverage
9. **Look for performance issues** - Check for N+1 queries, optimization
10. **Verify documentation** - Ensure API docs and README are updated
11. **Test locally** - Run the code and test edge cases
12. **Provide feedback** - Summarize findings by category

## Red Flags 🚩

- Missing authentication or authorization checks
- No error handling (unhandled exceptions)
- SQL injection vulnerabilities
- Hardcoded secrets or credentials
- N+1 query problems
- No input validation
- Silent failures without logging
- Transaction handling missing for multi-step operations
- Sensitive data in logs
- Performance issues (slow queries, unnecessary calls)
- Missing tests or very low coverage
- No migration for schema changes

## Questions to Ask

- How does this handle errors?
- Is the user authorized to perform this action?
- Could this cause performance issues at scale?
- Are there any security vulnerabilities?
- Is this tested?
- Is this documented?
- What happens if the external service is down?
- What happens with concurrent requests?

## Tips for Effective Review

- Test the API with curl, Postman, or similar
- Check error responses
- Test authorization (try as different user roles)
- Look at database queries in logs
- Run performance profiler if needed
- Check test coverage
- Look for security issues (OWASP Top 10)
