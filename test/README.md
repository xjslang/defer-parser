# Test Structure

This directory contains all testing infrastructure for the XJS parser.

## Directory Structure

```
test/
├── fixtures/          # Test data files (.xjs input + .out expected output)
├── benchmarks/        # Performance benchmarks (planned)
└── README.md         # This file
```

## Fixtures

The `fixtures/` directory contains behavior test data:

- `*.xjs` files: Input code with XJS syntax (defer statements, etc.)
- `*.out` files: Expected console output when the transformed code is executed

## Running Tests

```bash
# Run all tests
npm test

# Run tests with verbose output
npm run test:verbose
```

## Adding New Tests

1. Create a new `.xjs` file in `fixtures/` with your test input
2. Create a corresponding `.out` file with the expected console output
3. The test runner will automatically discover and run the new test

## Future Plans

- `benchmarks/`: Performance testing for parser operations
- Unit tests for individual components
- Integration tests for end-to-end workflows
