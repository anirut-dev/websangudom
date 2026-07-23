---
name: architecture-reviewer
description: Comprehensive architecture review covering system design, scalability, maintainability, integration patterns, and technical decisions
---

# Architecture Code Reviewer

Review architectural changes including system design, scalability, maintainability, integration patterns, and major technical decisions.

## Pre-Review Checklist

- [ ] Read architecture decision record (ADR) or design document if available
- [ ] Understand the problem being solved
- [ ] Identify new services, modules, or major structural changes
- [ ] List external dependencies or integrations
- [ ] Review if this affects multiple teams/systems
- [ ] Check for impact on deployment pipeline
- [ ] Determine if this is a breaking architectural change

## Design Principles Checklist

- [ ] Follows SOLID principles
  - [ ] Single Responsibility (each component has one reason to change)
  - [ ] Open/Closed (open for extension, closed for modification)
  - [ ] Liskov Substitution (subtypes substitutable for supertypes)
  - [ ] Interface Segregation (clients don't depend on interfaces they don't use)
  - [ ] Dependency Inversion (depend on abstractions, not concretions)
- [ ] DRY principle (Don't Repeat Yourself) applied
- [ ] KISS principle (Keep It Simple, Stupid) maintained
- [ ] YAGNI principle (You Aren't Gonna Need It) observed
- [ ] Separation of concerns maintained
- [ ] Layered architecture followed (if applicable)

## Scalability Checklist

- [ ] Stateless design for horizontal scaling
- [ ] No local state that can't be distributed
- [ ] Database design supports growth
- [ ] Caching strategy for frequently accessed data
- [ ] Queue/async processing for long operations
- [ ] Load balancing compatible
- [ ] Connection pooling configured
- [ ] Resource limits considered
- [ ] Partitioning/sharding strategy if needed
- [ ] Rate limiting and throttling mechanisms
- [ ] Circuit breakers for resilience
- [ ] Graceful degradation under load

## Modularity & Maintainability Checklist

- [ ] Clear module/component boundaries
- [ ] No circular dependencies
- [ ] Cohesion high (related code together)
- [ ] Coupling low (modules independent)
- [ ] Easy to understand module purpose
- [ ] Module interfaces clearly defined
- [ ] No "god classes" or "god modules"
- [ ] Code organization reflects business domain
- [ ] Conventions consistent across codebase
- [ ] Easy to test in isolation
- [ ] Team can understand and modify easily

## Integration & Compatibility Checklist

- [ ] Integration points clearly defined
- [ ] APIs/contracts well-documented
- [ ] Versioning strategy for breaking changes
- [ ] Backward compatibility considered (or migration path)
- [ ] Integration with existing systems smooth
- [ ] Data contracts defined
- [ ] Error handling for integration failures
- [ ] Monitoring of integration points
- [ ] Performance impact on existing systems
- [ ] No hidden dependencies between systems

## Resilience & Fault Tolerance Checklist

- [ ] Failure scenarios identified and handled
- [ ] No single points of failure (if critical)
- [ ] Retry logic with exponential backoff
- [ ] Circuit breakers for external calls
- [ ] Timeouts configured appropriately
- [ ] Graceful degradation when dependencies fail
- [ ] Health checks for critical components
- [ ] Fallback strategies defined
- [ ] Data consistency under failures
- [ ] Recovery procedures documented
- [ ] Chaos engineering/failure testing considered

## Performance & Optimization Checklist

- [ ] Bottlenecks identified (or will be monitored)
- [ ] Unnecessary network calls eliminated
- [ ] Caching strategy appropriate
- [ ] Database queries optimized
- [ ] Batch operations used when applicable
- [ ] Async processing for non-blocking operations
- [ ] Resource usage optimized (memory, CPU, disk)
- [ ] Content delivery strategy (CDN if applicable)
- [ ] Performance benchmarks established
- [ ] Profiling tools in place
- [ ] Performance regressions prevented (testing)

## Security Architecture Checklist

- [ ] Authentication strategy clear
- [ ] Authorization model defined
- [ ] Defense in depth (multiple security layers)
- [ ] Input validation at system boundaries
- [ ] Encryption strategy (at rest, in transit)
- [ ] Key management strategy
- [ ] Secrets management (not hardcoded)
- [ ] Audit logging for security events
- [ ] Security headers configured
- [ ] CORS policy defined
- [ ] Rate limiting to prevent abuse
- [ ] Injection vulnerabilities prevented
- [ ] No information disclosure in errors
- [ ] Regular security audits planned

## Deployment & Operations Checklist

- [ ] Deployment process clear and documented
- [ ] Rollback strategy defined
- [ ] Blue-green or canary deployment possible
- [ ] Feature flags for gradual rollout
- [ ] Configuration management strategy
- [ ] Environment parity (dev, staging, prod)
- [ ] Monitoring and alerting in place
- [ ] Logging strategy comprehensive
- [ ] Health checks for all services
- [ ] Graceful shutdown handling
- [ ] Database migration strategy
- [ ] Disaster recovery plan
- [ ] Runbook for common issues

## Documentation Checklist

- [ ] Architecture diagram present
- [ ] Component responsibilities documented
- [ ] Integration points documented
- [ ] Data flow documented
- [ ] Technology choices justified
- [ ] Trade-offs documented
- [ ] Deployment instructions clear
- [ ] Operational procedures documented
- [ ] Known limitations documented
- [ ] Future scaling strategy documented
- [ ] Decision records maintained (ADRs)
- [ ] Onboarding guide for new developers

## Technology Stack Checklist

- [ ] Technology choices justified
- [ ] Consistency across related systems
- [ ] Not adding unnecessary complexity
- [ ] Team has expertise or learning path
- [ ] Ecosystem and community support strong
- [ ] Vendor lock-in considered
- [ ] Cost implications understood
- [ ] License compatibility verified
- [ ] Security track record checked
- [ ] Performance characteristics suitable

## Testing Architecture Checklist

- [ ] Unit tests isolate components
- [ ] Integration tests verify interactions
- [ ] End-to-end tests cover critical paths
- [ ] Test pyramid balanced (many unit, some integration, few E2E)
- [ ] Mock/stub strategy clear
- [ ] Performance testing included
- [ ] Chaos engineering tests for resilience
- [ ] Backward compatibility testing
- [ ] Load testing for scale
- [ ] Security testing included

## Observability Checklist

- [ ] Logging strategy defined (what, where, how)
- [ ] Metrics collected for key components
- [ ] Distributed tracing for request flows
- [ ] Alerting rules for important events
- [ ] SLOs/SLIs defined if customer-facing
- [ ] Dashboards for operational visibility
- [ ] Log aggregation for central access
- [ ] Performance monitoring in place
- [ ] Error tracking and alerting
- [ ] Usage analytics

## Workflow Steps

1. **Understand the problem** - Read design document or ADR
2. **Map the architecture** - Draw or understand the system diagram
3. **Identify components** - List all major components and responsibilities
4. **Check design principles** - Verify SOLID principles, separation of concerns
5. **Assess scalability** - Consider growth and load handling
6. **Review integration** - Check how systems communicate
7. **Evaluate resilience** - Identify failure scenarios and recovery
8. **Check performance** - Look for bottlenecks and optimization
9. **Verify security** - Ensure security architecture is solid
10. **Confirm deployment** - Verify can be deployed safely
11. **Review documentation** - Check completeness of architecture docs
12. **Provide feedback** - Summarize findings and recommendations

## Red Flags 🚩

- God classes or god modules (too many responsibilities)
- Circular dependencies between modules
- Tight coupling between components
- No clear separation of concerns
- Single points of failure for critical components
- Synchronous calls where async would be better
- No error handling or resilience strategy
- Missing authentication or authorization
- Hardcoded configuration or secrets
- No monitoring or observability
- Untested architecture assumptions
- Monolithic structure when microservices needed
- Microservices when monolith would suffice
- No versioning strategy for APIs
- Missing documentation or design rationale
- Technology choices without justification

## Questions to Ask

- Why was this architectural approach chosen?
- How does this scale with growth?
- What happens when this component fails?
- Is there a single point of failure?
- Can we deploy this independently?
- How do teams communicate across this architecture?
- What are the performance implications?
- Is this maintainable long-term?
- Can we test this effectively?
- How does this integrate with existing systems?
- Is there a clear migration path if needs change?

## Tips for Effective Review

- Draw diagrams to understand data and control flow
- Identify critical vs. non-critical paths
- Look for unnecessary complexity
- Consider operational burden
- Think about team structure and communication
- Imagine the system at 10x scale
- Consider failure scenarios
- Review similar architectures in industry
- Check technology maturity and adoption
- Validate assumptions with metrics/data

## Architecture Anti-Patterns to Watch For

- **Big Ball of Mud** - No clear structure or boundaries
- **Leaky Abstractions** - Implementation details leak through interfaces
- **Gold Plating** - Over-engineering for hypothetical future needs
- **Cargo Cult Programming** - Copying patterns without understanding why
- **Resume-Driven Development** - Using latest tech for resume value, not value
- **N-Tier Hell** - Too many layers adding complexity without benefit
- **Distributed Monolith** - Multiple services tightly coupled like a monolith
- **Microservice as Debug Tool** - Creating services just for debugging capability
