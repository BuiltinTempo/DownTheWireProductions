#!/usr/bin/env python3
"""Read-only DTW Chromium regression checks. Never submit a website form."""
import argparse
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright

CHECKS = 0


def require(condition, message):
    global CHECKS
    assert condition, message
    CHECKS += 1
    print("PASS:", message)


def main(base_url):
    errors = []
    unexpected_mutations = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(
            viewport={"width": 1280, "height": 850},
            service_workers="block",
            ignore_https_errors=False,
        )

        def safe_route(route):
            # Even a test bug must not submit data to FormSubmit/Supabase/CRM.
            if route.request.method.upper() not in ("GET", "HEAD"):
                unexpected_mutations.append(route.request.method + " " + route.request.url)
                route.abort()
            else:
                route.continue_()

        context.route("**/*", safe_route)

        def visit(path):
            page = context.new_page()
            def record_console(message):
                txt = message.text
                if "Content Security Policy" in txt and (
                    "Refused" in txt or "violat" in txt.lower()
                ):
                    errors.append(path + " [CSP] " + txt[:600])
            page.on("console", record_console)
            page.on("pageerror", lambda exc: errors.append(path + " [JS] " + str(exc)[:600]))
            url = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
            response = page.goto(url, wait_until="domcontentloaded", timeout=35000)
            require(response is not None and response.status == 200, path + " loads with HTTP 200")
            policy = page.locator('meta[http-equiv="Content-Security-Policy"]').get_attribute("content")
            require(policy is not None and "script-src 'self'" in policy and
                    "script-src-attr 'none'" in policy, path + " has enforced script policy")
            page.wait_for_timeout(300)
            return page

        home = visit("/")
        require(home.locator("main h1").count() >= 1, "Homepage headline appears")
        require(home.locator("form[action*='dtw-form-intake']").count() == 1,
                "Homepage inquiry form is present")
        require(home.locator(".nav-rent-toggle").count() == 1,
                "Shared site.js builds the Rentals navigation")
        require(home.locator("[data-year]").first.inner_text().strip().isdigit(),
                "Shared site.js updates the footer year")
        home.close()

        mobile = context.new_page()
        mobile.set_viewport_size({"width": 390, "height": 844})
        mobile.goto(urljoin(base_url.rstrip("/") + "/", "index.html"),
                    wait_until="domcontentloaded", timeout=35000)
        mobile.locator(".menu-toggle").click()
        require(mobile.locator(".menu-toggle").get_attribute("aria-expanded") == "true",
                "Mobile navigation can open")
        mobile.locator(".menu-toggle").click()
        require(mobile.locator(".menu-toggle").get_attribute("aria-expanded") == "false",
                "Mobile navigation can close")
        mobile.close()

        panasonic = visit("/rent-panasonic-hcx2.html")
        panasonic.locator("#gallery-thumbs .gallery-thumb").first.wait_for(timeout=12000)
        require(panasonic.locator("#gallery-thumbs .gallery-thumb").count() >= 3,
                "Panasonic gallery initializes thumbnails")
        before = panasonic.locator("#gallery-main").get_attribute("src")
        panasonic.locator(".gallery-next").click()
        after = panasonic.locator("#gallery-main").get_attribute("src")
        require(before != after, "Panasonic next-image button changes the photo")
        panasonic.locator("#gallery-main").click()
        require(panasonic.locator("#gallery-modal").get_attribute("aria-hidden") == "false",
                "Panasonic gallery lightbox opens")
        panasonic.locator(".gallery-close").click()
        require(panasonic.locator("#gallery-modal").get_attribute("aria-hidden") == "true",
                "Panasonic gallery lightbox closes")
        require(panasonic.locator("form[action^='https://formsubmit.co/']").count() == 2,
                "Panasonic rental and inventory forms retain FormSubmit destinations")
        panasonic.close()

        malformed = visit("/rent-panasonic-hcx2.html?submitted=1#%ZZ")
        require(malformed.locator("#gallery-thumbs .gallery-thumb").count() >= 3,
                "Malformed URL fragments do not interrupt gallery initialization")
        malformed.close()

        ursa = visit("/rent-ursa-broadcast-g2.html")
        require(ursa.locator("form[action^='https://formsubmit.co/']").count() == 1,
                "URSA rental form remains available")
        require(ursa.locator('input[name="_captcha"][value="true"]').count() == 1 and
                ursa.locator('input[name="_honey"]').count() == 1,
                "URSA rental form retains CAPTCHA and honeypot configuration")
        ursa.close()

        checklist = visit("/broadcast-planning-checklist.html")
        require(checklist.locator("#lead-form #lead-email").count() == 1 and
                checklist.locator("#lead-submit").count() == 1,
                "Checklist signup form and button render")
        require(not checklist.locator("#lead-consent").evaluate("(el) => el.required"),
                "Checklist marketing consent remains optional")
        checklist.locator("#lead-email").fill("not-an-email")
        require(not checklist.locator("#lead-email").evaluate("(el) => el.validity.valid"),
                "Checklist invalid email is blocked by native form validation")
        checklist.close()

        field = visit("/field-notes-signup.html")
        require(field.locator("#fn-form").count() == 1, "Field Notes form renders")
        require(field.locator("#fn-consent").evaluate("(el) => el.required"),
                "Field Notes explicit opt-in is required")
        field.close()

        rental = visit("/rentals.html")
        require(rental.locator("form[action*='dtw-form-intake']").count() == 1,
                "Main rental quote form remains available")
        rental.close()

        browser.close()

    require(not unexpected_mutations, "No POST, PUT, PATCH or DELETE requests were attempted")
    if errors:
        for err in errors:
            print("FAIL:", err)
    require(not errors, "No browser JavaScript exceptions or CSP execution violations")
    print("SUCCESS: %d read-only Chromium checks against %s" % (CHECKS, base_url))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    main(parser.parse_args().base_url)
