---
name: frontend-reviewer
description: Comprehensive frontend code review covering UI/UX, performance, accessibility, and component quality
---

# Frontend Code Reviewer

Review frontend code changes for quality, performance, accessibility, and maintainability.

## Pre-Review Checklist

- [ ] Review files changed (focus on `.tsx`, `.ts`, `.jsx`, `.js`, CSS files)
- [ ] Identify component changes vs. utility/hook changes
- [ ] Check for new dependencies added to `package.json`
- [ ] Look for any console errors or warnings in the diff

## Component Quality Checklist

- [ ] Components follow naming conventions (PascalCase for components)
- [ ] Props are properly typed (TypeScript interfaces/types defined)
- [ ] Component responsibilities are single and focused
- [ ] Unnecessary re-renders are avoided (useMemo, useCallback used correctly)
- [ ] Dependencies arrays in hooks are complete and correct
- [ ] No direct DOM manipulation (querySelector, getElementById, etc.)
- [ ] Proper error boundaries for error handling
- [ ] Loading and empty states are handled
- [ ] PropTypes or TypeScript provide type safety

## State Management Checklist

- [ ] State is located at the appropriate level (lifting state when needed)
- [ ] No excessive state mutations
- [ ] Context usage is appropriate (not overused for small state)
- [ ] Redux/Zustand/Jotai patterns followed correctly if used
- [ ] Avoid prop drilling with 5+ levels of props
- [ ] State updates are immutable

## Performance Checklist

- [ ] No unnecessary re-renders of large lists (use key prop correctly)
- [ ] Image optimization (lazy loading, proper sizes, formats)
- [ ] Bundle size impact is minimal (code splitting considered)
- [ ] Animations use CSS or requestAnimationFrame, not setInterval
- [ ] No memory leaks in useEffect cleanup
- [ ] API calls debounced/throttled if needed
- [ ] Large computations memoized or moved to Web Workers

## Accessibility (a11y) Checklist

- [ ] ARIA labels present for interactive elements
- [ ] Semantic HTML used (button, nav, header, etc., not divs)
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Form labels associated with inputs (for/id)
- [ ] No keyboard traps
- [ ] Links distinguishable from regular text

## Styling Checklist

- [ ] CSS classes follow naming conventions (BEM or consistent pattern)
- [ ] No inline styles (except for dynamic values)
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] No hardcoded colors (use design tokens/CSS variables)
- [ ] Media queries placed logically
- [ ] Unused CSS removed
- [ ] Dark mode support if required

## Testing Checklist

- [ ] Unit tests for components (if test file included)
- [ ] Mocks are appropriate and not over-mocked
- [ ] Test coverage for critical paths
- [ ] Snapshots not overused
- [ ] Integration tests for complex flows

## Security Checklist

- [ ] No hardcoded secrets or API keys
- [ ] XSS vulnerabilities checked (dangerouslySetInnerHTML justified)
- [ ] User input properly sanitized
- [ ] CSRF tokens used for mutations
- [ ] Sensitive data not logged to console

## Workflow Steps

1. **Scan the diff** - Get a quick overview of what's changing
2. **Identify component structure** - Map out the component hierarchy
3. **Check TypeScript compliance** - Verify types are correct
4. **Review state management** - Ensure state is handled correctly
5. **Audit performance** - Look for render optimization opportunities
6. **Verify accessibility** - Test keyboard navigation and screen reader support
7. **Inspect styling** - Check responsive design and design consistency
8. **Run locally** - Test the feature in the browser
9. **Check console** - Look for errors, warnings, and performance issues
10. **Provide feedback** - Summarize findings and prioritize issues

## Red Flags 🚩

- Large components (>500 lines) that should be split
- Deeply nested conditionals
- Missing or incorrect type definitions
- Deprecated lifecycle methods
- Hardcoded magic numbers or strings
- No error handling for API calls
- Missing loading states
- Accessibility violations (color contrast, missing ARIA labels)
- Performance issues (large bundle, slow renders)
- Security vulnerabilities (XSS, unvalidated input)

## Questions to Ask

- Could this component be smaller/more focused?
- Are all props necessary?
- Is there better error handling needed?
- Could this be more accessible?
- Is performance acceptable for all user types?
- Does this follow our design system?

## Tips for Effective Review

- Test the feature yourself in the browser
- Use browser DevTools to check performance
- Run accessibility checker (axe, Lighthouse)
- Look at error logs and warnings
- Consider mobile and different screen sizes
- Think about edge cases and error scenarios
