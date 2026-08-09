.PHONY: verify secret-scan

verify:
	python3 scripts/verify_contract.py
	PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_*.py' -v

secret-scan:
	gitleaks dir . --config .gitleaks.toml --no-banner --redact
