# SnapProof Testing Guide

**Version**: 1.0  
**Last Updated**: January 17, 2026

---

## 🎯 Testing Strategy

### Test Pyramid

```
           E2E Tests (5%)
         ________________
        /                \
       /  Integration (15%) \
      /______________________\
     /                        \
    /    Unit Tests (80%)      \
   /____________________________\
```

### Coverage Goals
- **Unit Tests**: 80% coverage
- **Integration Tests**: Key user flows
- **E2E Tests**: Critical paths only

---

## 🧪 Test Categories

### 1. Unit Tests

**What to Test:**
- Pure functions (utilities, helpers)
- React hooks
- State stores (Zustand)
- Type validators
- Performance trackers

**Tools:**
- Jest
- React Testing Library
- @testing-library/hooks

**Example Files:**
```
src/
  __tests__/
    utils/
      smartFolders.test.ts
      undoStack.test.ts
    hooks/
      useCaptureSearch.test.ts
      useSmartFolders.test.ts
    stores/
      captureStore.test.ts
      templateBuilderStore.test.ts
```

---

### 2. Integration Tests

**What to Test:**
- Component interactions
- IPC communication
- Data flow (capture → store → UI)
- Modal workflows
- Report generation

**Tools:**
- Jest
- React Testing Library
- Mock IPC

**Key Flows:**
1. Create capture → Preview → Save
2. Create flow → Add captures → Reorder → Save
3. Generate report → Select template → Export
4. Smart folder → Filter → View captures

---

### 3. E2E Tests

**What to Test:**
- Full user journeys
- Cross-window interactions
- File system operations
- Screenshot capture

**Tools:**
- Playwright (recommended)
- Spectron (Electron-specific)

**Critical Paths:**
1. First-time user onboarding
2. Capture workflow (window → region)
3. Report generation end-to-end
4. Template builder flow

---

## 📋 Feature Test Checklist

### Phase 1: Stabilization

#### Logger
- [ ] Logs to buffer correctly
- [ ] Categories filter properly
- [ ] Export creates valid JSON
- [ ] Buffer maintains max size (1000)

#### Error Boundaries
- [ ] Catches component errors
- [ ] Shows error UI
- [ ] "Copy Details" works
- [ ] Retry resets state

#### Type Safety
- [ ] No `any` types in preload
- [ ] IPC handlers typed correctly
- [ ] Store types enforce contracts

---

### Phase 2: UX & Performance

#### Search & Filtering
- [ ] Text search matches titles
- [ ] Date filters (today, week, month) work
- [ ] Status filters work
- [ ] Multi-word AND logic
- [ ] Clear filters resets state

#### Undo/Redo
- [ ] Ctrl+Z undoes last action
- [ ] Ctrl+Shift+Z redoes
- [ ] Toast shows feedback
- [ ] 4-second delete window
- [ ] Stack max size (50)

#### Keyboard Shortcuts
- [ ] All 14 shortcuts work
- [ ] Modal opens with Ctrl+?
- [ ] Search filters shortcuts
- [ ] Shortcuts don't conflict

#### Virtualization
- [ ] Handles 1000+ items
- [ ] Smooth scrolling
- [ ] No layout shift
- [ ] Content visibility works

---

### Phase 3: Advanced Features

#### Smart Folders
- [ ] Badge counts accurate
- [ ] Predicates filter correctly
- [ ] Auto-updates on changes
- [ ] Empty states show
- [ ] Routing works

#### Drag & Drop
- [ ] Reorders captures in flows
- [ ] Visual feedback during drag
- [ ] Keyboard support (arrows + space)
- [ ] Order persists after save

#### Export Progress
- [ ] Progress updates (0-100%)
- [ ] Milestones show
- [ ] Cancel stops generation
- [ ] Success shows reveal button

#### Performance Dashboard
- [ ] Shows correct metrics
- [ ] Auto-refreshes (5s)
- [ ] Export JSON works
- [ ] Clear resets data

#### Template Builder
- [ ] Drag to reorder works
- [ ] Layout changes apply
- [ ] Style updates reflect
- [ ] Template saves
- [ ] Load template works

---

## 🔧 Test Setup

### Installing Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest ts-jest @types/jest
```

### Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/main/**' // Exclude main process
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

---

## 📝 Example Tests

### 1. Smart Folders Predicate Test

```typescript
// src/__tests__/utils/smartFolders.test.ts
import { evaluatePredicate, PREDEFINED_SMART_FOLDERS } from '@/shared/types/SmartFolder';
import { CaptureItem } from '@/shared/types';

describe('Smart Folders', () => {
  const mockCapture: CaptureItem = {
    id: 'test-1',
    timestamp: Date.now(),
    title: 'Test Capture',
    status: 'success',
    flowId: 'flow-1'
  };

  describe('evaluatePredicate', () => {
    it('should match status predicate', () => {
      const predicate = { field: 'status', operator: 'equals', value: 'success' };
      expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
    });

    it('should match today predicate', () => {
      const predicate = { field: 'date', operator: 'equals', value: 'today' };
      expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
    });

    it('should match hasFlow predicate', () => {
      const predicate = { field: 'hasFlow', operator: 'exists' };
      expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
    });
  });

  describe('PREDEFINED_SMART_FOLDERS', () => {
    it('should have 5 folders', () => {
      expect(PREDEFINED_SMART_FOLDERS).toHaveLength(5);
    });

    it('should all be predefined', () => {
      PREDEFINED_SMART_FOLDERS.forEach(folder => {
        expect(folder.isPredefined).toBe(true);
      });
    });
  });
});
```

### 2. Capture Search Hook Test

```typescript
// src/__tests__/hooks/useCaptureSearch.test.ts
import { renderHook } from '@testing-library/react';
import { useCaptureSearch } from '@/renderer/hooks/useCaptureSearch';

describe('useCaptureSearch', () => {
  const mockCaptures = [
    { id: '1', title: 'Login Screen', status: 'success', timestamp: Date.now() },
    { id: '2', title: 'Dashboard View', status: 'success', timestamp: Date.now() - 86400000 },
    { id: '3', title: 'Error Page', status: 'failure', timestamp: Date.now() }
  ];

  it('should return all captures when no filters', () => {
    const { result } = renderHook(() => useCaptureSearch(mockCaptures, ''));
    expect(result.current.captures).toHaveLength(3);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should filter by search query', () => {
    const { result } = renderHook(() => useCaptureSearch(mockCaptures, 'Login'));
    expect(result.current.captures).toHaveLength(1);
    expect(result.current.captures[0].title).toBe('Login Screen');
  });

  it('should filter by status', () => {
    const { result } = renderHook(() => 
      useCaptureSearch(mockCaptures, '', { status: 'failure' })
    );
    expect(result.current.captures).toHaveLength(1);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should filter by date range', () => {
    const { result } = renderHook(() => 
      useCaptureSearch(mockCaptures, '', { dateRange: 'today' })
    );
    expect(result.current.captures).toHaveLength(2);
  });
});
```

### 3. Template Builder Store Test

```typescript
// src/__tests__/stores/templateBuilderStore.test.ts
import { useTemplateBuilderStore } from '@/renderer/stores/templateBuilderStore';

describe('TemplateBuilderStore', () => {
  beforeEach(() => {
    useTemplateBuilderStore.getState().clear?.();
  });

  it('should create new template', () => {
    const { createNewTemplate, currentTemplate } = useTemplateBuilderStore.getState();
    createNewTemplate();
    
    const template = useTemplateBuilderStore.getState().currentTemplate;
    expect(template).toBeTruthy();
    expect(template?.name).toBe('Untitled Template');
    expect(template?.layout).toBe('grid');
  });

  it('should update template', () => {
    const { createNewTemplate, updateTemplate } = useTemplateBuilderStore.getState();
    createNewTemplate();
    
    updateTemplate({ name: 'My Custom Template' });
    
    const template = useTemplateBuilderStore.getState().currentTemplate;
    expect(template?.name).toBe('My Custom Template');
  });

  it('should save template to list', async () => {
    const { createNewTemplate, saveTemplate } = useTemplateBuilderStore.getState();
    createNewTemplate();
    
    await saveTemplate();
    
    const { savedTemplates } = useTemplateBuilderStore.getState();
    expect(savedTemplates).toHaveLength(1);
  });
});
```

---

## 🎬 Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

### Specific File
```bash
npm test -- smartFolders.test.ts
```

---

## 🐛 Debugging Tests

### VS Code Debug Config

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Issues

**Issue**: Module not found  
**Fix**: Check `moduleNameMapper` in jest.config.js

**Issue**: CSS imports fail  
**Fix**: Add `identity-obj-proxy` for style mocks

**Issue**: Async tests timeout  
**Fix**: Increase timeout: `jest.setTimeout(10000)`

---

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## ✅ Pre-Release Checklist

- [ ] All unit tests pass
- [ ] Coverage > 70%
- [ ] No console errors
- [ ] Performance benchmarks met
- [ ] Manual smoke test
- [ ] E2E critical paths pass
- [ ] No TypeScript errors
- [ ] Bundle size acceptable

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
