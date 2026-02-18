# Contributing to Axon

Thank you for wanting to contribute to Axon! This document explains how to get involved.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## How Can I Contribute?

### Bug Reports

1. First check if the bug has already been reported
2. Create a new issue using the "Bug Report" template
3. Describe the problem in as much detail as possible:
   - Expected behavior
   - Actual behavior
   - Steps to reproduce
   - Screenshots (if helpful)
   - System information

### Feature Requests

1. Check if the feature has already been suggested
2. Create a new issue using the "Feature Request" template
3. Describe:
   - The problem you want to solve
   - Your proposed solution
   - Alternatives you have considered

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my new feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### With Docker

```bash
docker-compose up -d
```

## Code Standards

### Python (Backend)

- Python 3.11+
- Type hints for all functions
- Docstrings for public functions
- Formatting with Black
- Linting with Ruff
- Tests with pytest

```bash
# Format
black backend/

# Lint
ruff check backend/

# Test
pytest backend/tests/
```

### TypeScript (Frontend)

- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling
- ESLint for linting

```bash
# Lint
npm run lint

# Type check
npm run type-check
```

### Commit Messages

We use conventional commit messages:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting (no code change)
- `refactor:` Code refactoring
- `test:` Add/modify tests
- `chore:` Maintenance

Examples:
```
feat: Add web search tool
fix: Correct file path validation
docs: Update installation guide
```

## Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Refactoring

## Pull Request Process

1. Make sure all tests pass
2. Update the documentation if needed
3. The PR will be reviewed by at least one maintainer
4. After approval, the PR will be merged

## License

By contributing, you agree that your code will be published under the [Apache License 2.0](LICENSE).

## Questions?

- GitHub Discussions for general questions
- GitHub Issues for bugs and features
- Email: service@neurovexon.com

---

Thank you for your contribution!
