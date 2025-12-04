# Comprehensive Testing Plan - BreadWinner Ad Builder

## Overview

Full testing framework with:
- **Backend**: pytest + pytest-cov (Python)
- **Frontend**: Playwright (E2E) + Vitest (unit)
- **Security**: Bandit, pip-audit, npm audit, ESLint security, gitleaks
- **CI/CD**: GitHub Actions + local pre-commit hooks

---

## 1. Test Infrastructure Setup

### 1.1 Backend Testing (pytest)

**New dependencies:**
```
pytest==8.3.0
pytest-cov==4.1.0
pytest-asyncio==0.23.0
httpx==0.25.1
bandit==1.7.8
pip-audit==2.7.0
```

**Directory structure:**
```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Fixtures (exists)
│   ├── unit/
│   │   ├── test_auth.py
│   │   ├── test_brands.py
│   │   ├── test_products.py
│   │   ├── test_profiles.py
│   │   ├── test_generated_ads.py
│   │   ├── test_copy_generation.py
│   │   ├── test_facebook.py
│   │   ├── test_uploads.py
│   │   └── test_templates.py
│   ├── integration/
│   │   ├── test_ad_creation_flow.py
│   │   ├── test_facebook_publish_flow.py
│   │   └── test_video_flow.py
│   └── security/
│       ├── test_auth_security.py
│       ├── test_file_upload_security.py
│       └── test_injection.py
├── pytest.ini
└── .coveragerc
```

### 1.2 Frontend Testing (Playwright + Vitest)

**New dependencies:**
```json
{
  "devDependencies": {
    "vitest": "^1.6.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0",
    "eslint-plugin-security": "^2.1.0"
  }
}
```

**Directory structure:**
```
frontend/
├── tests/                    # Playwright E2E (exists)
│   ├── auth/
│   │   ├── login.spec.js
│   │   ├── logout.spec.js
│   │   └── token-refresh.spec.js
│   ├── brands/
│   │   ├── crud.spec.js
│   │   └── products.spec.js
│   ├── ads/
│   │   ├── image-ad-flow.spec.js
│   │   ├── video-ad-flow.spec.js
│   │   └── gallery.spec.js
│   ├── facebook/
│   │   ├── campaign-creation.spec.js
│   │   └── ad-publish.spec.js
│   └── fixtures/
│       └── test-data.js
├── src/__tests__/            # Vitest unit tests
│   ├── components/
│   │   ├── Toast.test.jsx
│   │   ├── BrandForm.test.jsx
│   │   └── AdCard.test.jsx
│   └── lib/
│       └── facebookApi.test.js
├── vitest.config.js
└── playwright.config.js      # (exists)
```

---

## 2. Backend Test Cases

### 2.1 Authentication & Authorization

| Test | Description | Priority |
|------|-------------|----------|
| `test_register_user` | Create user with valid data | High |
| `test_register_duplicate_email` | Reject duplicate email | High |
| `test_login_valid_credentials` | Return access + refresh tokens | High |
| `test_login_invalid_password` | Return 401 | High |
| `test_login_disabled_user` | Reject disabled users | High |
| `test_token_refresh` | Exchange refresh for new access token | High |
| `test_token_refresh_expired` | Reject expired refresh token | High |
| `test_logout_invalidates_token` | Refresh token deleted from DB | Medium |
| `test_protected_route_no_token` | Return 401 | High |
| `test_protected_route_invalid_token` | Return 401 | High |
| `test_permission_required` | Check role-based access | High |
| `test_superuser_only_endpoints` | Non-admin gets 403 | High |

### 2.2 Brand Management

| Test | Description | Priority |
|------|-------------|----------|
| `test_create_brand` | Create with name, colors, voice | High |
| `test_create_brand_with_products` | Products created as children | High |
| `test_update_brand` | Update all fields | High |
| `test_delete_brand_cascade` | Products deleted on brand delete | High |
| `test_brand_profile_association` | Link/unlink customer profiles | Medium |
| `test_list_brands_pagination` | Page size, offset | Medium |
| `test_brand_validation` | Reject missing required fields | High |

### 2.3 Product Management

| Test | Description | Priority |
|------|-------------|----------|
| `test_create_product` | With brand_id FK | High |
| `test_product_shots_json` | Store/retrieve JSON array | High |
| `test_update_product` | Update description, shots, url | High |
| `test_delete_product` | Remove from DB | High |
| `test_product_orphan` | Product without brand | Medium |

### 2.4 Customer Profiles

| Test | Description | Priority |
|------|-------------|----------|
| `test_create_profile` | Demographics, pain_points, goals | High |
| `test_profile_brand_link` | Many-to-many relationship | Medium |
| `test_update_profile` | Partial updates | Medium |
| `test_delete_profile` | Unlinks from brands | Medium |

### 2.5 Generated Ads

| Test | Description | Priority |
|------|-------------|----------|
| `test_generate_image` | Fal.ai mock returns image URL | High |
| `test_batch_save_images` | Save multiple ads with bundle_id | High |
| `test_batch_save_videos` | Video ads with media_type='video' | High |
| `test_batch_save_mixed` | Image + video in same batch | High |
| `test_duplicate_detection` | Skip duplicate URLs | High |
| `test_export_csv` | CSV includes all fields | Medium |
| `test_filter_by_brand` | Filter ads by brand_id | Medium |
| `test_delete_ad` | Remove single ad | High |
| `test_default_media_type` | Defaults to 'image' | Medium |

### 2.6 Copy Generation

| Test | Description | Priority |
|------|-------------|----------|
| `test_generate_copy` | Returns headline, body, cta | High |
| `test_generate_variations` | Multiple variations returned | High |
| `test_regenerate_field` | Regenerate single field | Medium |
| `test_gemini_json_parsing` | Handle markdown code blocks | High |
| `test_gemini_fallback` | Handle API errors gracefully | Medium |

### 2.7 Facebook Integration

| Test | Description | Priority |
|------|-------------|----------|
| `test_get_ad_accounts` | List accounts with act_ prefix | High |
| `test_create_campaign` | Campaign with objective, budget | High |
| `test_create_adset` | AdSet with targeting, pixel | High |
| `test_create_ad` | Ad with creative | High |
| `test_upload_image` | Image to Facebook Ad Library | High |
| `test_upload_video` | Async video upload | High |
| `test_video_status_polling` | Check processing status | High |
| `test_video_thumbnails` | Get auto-generated thumbnails | Medium |
| `test_invalid_token` | Handle expired FB token | High |
| `test_rate_limiting` | Handle FB rate limits | Medium |
| `test_save_campaign_locally` | Persist to DB | Medium |

### 2.8 File Uploads

| Test | Description | Priority |
|------|-------------|----------|
| `test_upload_image_valid` | jpg, png, gif, webp | High |
| `test_upload_video_valid` | mp4, mov, avi, webm | High |
| `test_reject_invalid_type` | .exe, .sh, .bat blocked | Critical |
| `test_image_size_limit` | Reject > 10MB | High |
| `test_video_size_limit` | Reject > 500MB | High |
| `test_path_traversal` | Sanitize ../../../etc/passwd | Critical |
| `test_filename_sanitization` | UUID-based names | High |
| `test_r2_upload` | Mock S3 client | Medium |
| `test_local_fallback` | Save to /uploads when R2 disabled | Medium |

### 2.9 Templates & Ad Remix

| Test | Description | Priority |
|------|-------------|----------|
| `test_list_templates` | With filters (category, style) | Medium |
| `test_upload_template` | New winning ad | Medium |
| `test_blueprint_deconstruct` | Extract blueprint_json | Medium |
| `test_blueprint_reconstruct` | Apply to new brand | Medium |

---

## 3. Frontend Test Cases (Playwright E2E)

### 3.1 Authentication Flow

| Test | Description | Priority |
|------|-------------|----------|
| `test_login_page_loads` | Form elements visible | High |
| `test_login_success` | Redirect to dashboard | High |
| `test_login_failure` | Error toast shown | High |
| `test_logout` | Redirect to login, clear storage | High |
| `test_protected_route_redirect` | Unauthenticated → login | High |
| `test_token_refresh_automatic` | Background refresh works | Medium |

### 3.2 Brand Management UI

| Test | Description | Priority |
|------|-------------|----------|
| `test_brands_page_loads` | List renders | High |
| `test_create_brand_modal` | Form opens, submits | High |
| `test_edit_brand` | Update and save | High |
| `test_delete_brand_confirm` | Confirmation modal shown | High |
| `test_brand_color_picker` | Color selection works | Medium |

### 3.3 Image Ad Creation Flow

| Test | Description | Priority |
|------|-------------|----------|
| `test_wizard_step_navigation` | Next/back buttons | High |
| `test_template_selection` | Select from gallery | High |
| `test_brand_selection` | Choose brand | High |
| `test_product_selection` | Choose product | High |
| `test_copy_generation` | Generate button works | High |
| `test_image_generation` | Generate images | High |
| `test_batch_save` | Save all ads | High |
| `test_drag_drop_upload` | Drag image to upload | Medium |

### 3.4 Video Ad Creation Flow

| Test | Description | Priority |
|------|-------------|----------|
| `test_video_upload` | Upload video file | High |
| `test_video_url_paste` | Paste video URL | High |
| `test_thumbnail_selection` | Choose thumbnail | High |
| `test_video_preview` | Video plays in preview | Medium |
| `test_video_ad_save` | Save with videoId | High |

### 3.5 Generated Ads Gallery

| Test | Description | Priority |
|------|-------------|----------|
| `test_gallery_loads` | Ads displayed | High |
| `test_filter_by_bundle` | Filter works | Medium |
| `test_filter_by_media_type` | Image/video filter | Medium |
| `test_ad_preview_modal` | Click to enlarge | Medium |
| `test_ad_delete` | Delete with confirm | High |
| `test_csv_export` | Download CSV | Medium |

### 3.6 Facebook Campaign Management

| Test | Description | Priority |
|------|-------------|----------|
| `test_campaigns_page_loads` | List campaigns | High |
| `test_create_campaign_form` | Fill and submit | High |
| `test_create_adset` | Within campaign | High |
| `test_attach_ad` | Add ad to adset | High |
| `test_budget_toggle` | CBO vs ABO | Medium |
| `test_targeting_search` | Location search | Medium |

### 3.7 Toast Notifications

| Test | Description | Priority |
|------|-------------|----------|
| `test_success_toast` | Green toast appears | High |
| `test_error_toast` | Red toast appears | High |
| `test_toast_auto_dismiss` | Disappears after timeout | Medium |
| `test_no_browser_alert` | Never use alert() | Critical |
| `test_no_browser_confirm` | Never use confirm() | Critical |

---

## 4. Security Test Cases

### 4.1 Authentication Security

| Test | Description | Priority |
|------|-------------|----------|
| `test_password_hashing` | bcrypt used, not plaintext | Critical |
| `test_jwt_signature_verify` | Invalid signatures rejected | Critical |
| `test_jwt_expiration` | Expired tokens rejected | Critical |
| `test_brute_force_protection` | Rate limiting on login | High |
| `test_session_fixation` | New token on login | High |
| `test_token_in_headers_only` | No tokens in URL params | High |

### 4.2 File Upload Security

| Test | Description | Priority |
|------|-------------|----------|
| `test_mime_type_validation` | Check actual content, not extension | Critical |
| `test_path_traversal_prevention` | Reject ../ in filenames | Critical |
| `test_null_byte_injection` | Reject null bytes | Critical |
| `test_double_extension` | Reject image.jpg.exe | Critical |
| `test_content_type_spoofing` | Verify actual file type | High |

### 4.3 Injection Prevention

| Test | Description | Priority |
|------|-------------|----------|
| `test_sql_injection_login` | Parameterized queries | Critical |
| `test_sql_injection_search` | No raw SQL with user input | Critical |
| `test_xss_brand_name` | HTML escaped in output | Critical |
| `test_xss_ad_copy` | Script tags escaped | Critical |
| `test_command_injection` | No shell commands with user input | Critical |

### 4.4 API Security

| Test | Description | Priority |
|------|-------------|----------|
| `test_cors_headers` | Only allowed origins | High |
| `test_rate_limiting` | Prevent DoS | High |
| `test_error_no_stack_trace` | Production errors sanitized | High |
| `test_sensitive_data_logged` | No passwords in logs | Critical |

---

## 5. Security Scanning Tools

### 5.1 Bandit (Python SAST)

```bash
# Install
pip install bandit

# Run
bandit -r backend/app -f json -o bandit-report.json

# CI config
bandit -r backend/app --severity-level medium --confidence-level medium -f json
```

**Check for:**
- Hardcoded passwords
- SQL injection patterns
- Shell injection
- Insecure random
- Weak cryptography

### 5.2 pip-audit (Python Dependencies)

```bash
# Install
pip install pip-audit

# Run
pip-audit -r backend/requirements.txt --format json -o pip-audit-report.json
```

### 5.3 npm audit (JS Dependencies)

```bash
# Run in frontend/
npm audit --json > npm-audit-report.json

# Fix automatically
npm audit fix
```

### 5.4 ESLint Security Plugin

```javascript
// .eslintrc.js addition
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"]
}
```

**Checks:**
- eval() usage
- RegEx DoS
- Object injection
- Path traversal in requires

### 5.5 gitleaks (Secrets Detection)

```bash
# Install
brew install gitleaks

# Scan repo
gitleaks detect --source . --report-path gitleaks-report.json

# Pre-commit hook
gitleaks protect --staged
```

**Detects:**
- API keys
- Passwords
- AWS credentials
- Private keys

---

## 6. CI/CD Pipeline (GitHub Actions)

### 6.1 Main Workflow (.github/workflows/test.yml)

```yaml
name: Test Suite

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov bandit pip-audit

      - name: Run Bandit security scan
        run: |
          cd backend
          bandit -r app --severity-level medium -f json -o bandit-report.json || true
          cat bandit-report.json

      - name: Run pip-audit
        run: |
          cd backend
          pip-audit -r requirements.txt --format json || true

      - name: Run tests with coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          SECRET_KEY: test-secret-key-for-ci
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=html -v

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run npm audit
        run: |
          cd frontend
          npm audit --audit-level=high || true

      - name: Run ESLint with security
        run: |
          cd frontend
          npm run lint

      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: |
          cd frontend
          npm run test
        env:
          CI: true

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report

  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 6.2 Pre-commit Hooks (.pre-commit-config.yaml)

```yaml
repos:
  - repo: local
    hooks:
      - id: backend-tests
        name: Backend quick tests
        entry: bash -c 'cd backend && source venv/bin/activate && pytest tests/unit -x -q'
        language: system
        types: [python]
        pass_filenames: false

      - id: frontend-lint
        name: Frontend lint
        entry: bash -c 'cd frontend && npm run lint'
        language: system
        types: [javascript]
        pass_filenames: false

      - id: gitleaks
        name: Secrets scan
        entry: gitleaks protect --staged
        language: system
        pass_filenames: false

      - id: bandit
        name: Bandit security
        entry: bash -c 'cd backend && bandit -r app --severity-level high -q'
        language: system
        types: [python]
        pass_filenames: false
```

---

## 7. Test Fixtures & Mocks

### 7.1 Backend Fixtures (conftest.py additions)

```python
@pytest.fixture
def test_brand(db_session):
    """Create test brand."""
    brand = Brand(
        id="test-brand-1",
        name="Test Brand",
        primary_color="#FF0000",
        secondary_color="#00FF00",
        voice="Professional"
    )
    db_session.add(brand)
    db_session.commit()
    return brand

@pytest.fixture
def test_product(db_session, test_brand):
    """Create test product."""
    product = Product(
        id="test-product-1",
        brand_id=test_brand.id,
        name="Test Product",
        description="Test description",
        product_shots=["https://example.com/shot1.jpg"]
    )
    db_session.add(product)
    db_session.commit()
    return product

@pytest.fixture
def mock_gemini():
    """Mock Gemini API."""
    with patch('app.api.v1.copy_generation.genai') as mock:
        mock_model = MagicMock()
        mock_model.generate_content.return_value.text = json.dumps({
            "variations": [
                {"headline": "Test Headline", "body": "Test body", "cta": "Buy Now"}
            ]
        })
        mock.GenerativeModel.return_value = mock_model
        yield mock

@pytest.fixture
def mock_fal():
    """Mock Fal.ai API."""
    with patch('app.api.v1.generated_ads.fal_client') as mock:
        mock.submit_async.return_value.get.return_value = {
            "images": [{"url": "https://fal.ai/test-image.jpg"}]
        }
        yield mock
```

### 7.2 Frontend Fixtures (tests/fixtures/test-data.js)

```javascript
export const testUser = {
  email: 'test@playwright.com',
  password: 'testpass123'
};

export const testBrand = {
  name: 'Test Brand',
  primaryColor: '#FF0000',
  secondaryColor: '#00FF00',
  voice: 'Professional'
};

export const testProduct = {
  name: 'Test Product',
  description: 'A test product description',
  defaultUrl: 'https://example.com/product'
};

export async function loginAs(page, user = testUser) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard)?$/);
}

export async function mockApiResponse(page, url, response) {
  await page.route(url, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}
```

---

## 8. Coverage Requirements

| Area | Minimum Coverage |
|------|-----------------|
| Backend unit tests | 80% |
| Backend integration | 60% |
| Frontend E2E | Critical paths covered |
| Security tests | All OWASP Top 10 |

---

## 9. Running Tests

### Local Development

```bash
# Backend
cd backend
source venv/bin/activate
pytest                           # All tests
pytest tests/unit -v             # Unit tests only
pytest --cov=app --cov-report=html  # With coverage
pytest -x                        # Stop on first failure
pytest -k "test_auth"            # Run tests matching pattern

# Frontend
cd frontend
npm run test                     # Playwright headless
npm run test:headed              # Playwright with browser
npm run test:ui                  # Playwright UI mode
npm run test:debug               # Debug mode

# Security
cd backend && bandit -r app
cd frontend && npm audit
gitleaks detect --source .
```

### Pre-deployment Checklist

```bash
# Full test suite
./scripts/test-all.sh

# Quick smoke test
./scripts/smoke-test.sh
```

---

## 10. Implementation Order

### Phase 1: Foundation (Week 1)
1. ✅ pytest already set up
2. ✅ Playwright already set up
3. [ ] Add Vitest for frontend unit tests
4. [ ] Add security tools (bandit, pip-audit, gitleaks)
5. [ ] Create GitHub Actions workflow

### Phase 2: Backend Tests (Week 2)
1. [ ] Auth tests (all endpoints)
2. [ ] CRUD tests (brands, products, profiles)
3. [ ] Generated ads tests (expand existing)
4. [ ] Facebook integration tests (mocked)
5. [ ] File upload security tests

### Phase 3: Frontend Tests (Week 3)
1. [ ] Expand login tests
2. [ ] Brand CRUD E2E
3. [ ] Image ad creation flow
4. [ ] Video ad creation flow
5. [ ] Gallery and export tests

### Phase 4: Security & Integration (Week 4)
1. [ ] Security test suite
2. [ ] Integration tests (full flows)
3. [ ] Pre-commit hooks
4. [ ] Coverage reporting
5. [ ] Documentation

---

## Questions

- Test DB: use SQLite in-memory (fast) or PostgreSQL (production parity)?
- Facebook tests: mock-only or optional real API tests with test account?
- Video upload tests: mock S3/R2 or use localstack?
- Pre-commit: fail on warnings or errors only?
