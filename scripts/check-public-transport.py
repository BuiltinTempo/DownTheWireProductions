#!/usr/bin/env python3
"""Read-only protection against DTW website DNS or TLS drift.

This script does not change DNS, request certificates, or call private APIs.
When the site's hosting architecture is *deliberately* changed, review and
update the expected DNS values in the same pull request.
"""
from __future__ import annotations

import datetime as dt
import socket
import ssl
import subprocess
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

HOST = "downthewire.live"
EXPECTED_NS = {"ns1.vercel-dns.com.", "ns2.vercel-dns.com."}
# GitHub Pages official apex A and optional AAAA targets.
ALLOWED_A = {
    "185.199.108.153", "185.199.109.153",
    "185.199.110.153", "185.199.111.153",
}
ALLOWED_AAAA = {
    "2606:50c0:8000::153", "2606:50c0:8001::153",
    "2606:50c0:8002::153", "2606:50c0:8003::153",
}
MIN_CERT_VALIDITY_DAYS = 14


def lookup(record_type: str) -> set[str]:
    output = subprocess.check_output(
        ["dig", "+short", "+time=3", "+tries=2", record_type, HOST],
        text=True,
        timeout=15,
    )
    return {line.strip().lower() for line in output.splitlines() if line.strip()}


def check_dns() -> None:
    nameservers = lookup("NS")
    if nameservers != EXPECTED_NS:
        raise RuntimeError(
            f"Unexpected nameserver delegation: {sorted(nameservers)} "
            f"(expected {sorted(EXPECTED_NS)}). Investigate before changing DNS."
        )
    print("PASS: authoritative DNS still delegated to the expected Vercel nameservers")

    a_records = lookup("A")
    if not a_records or not a_records.issubset(ALLOWED_A):
        raise RuntimeError(
            f"Unexpected apex A records: {sorted(a_records)}. "
            "Expected only official GitHub Pages addresses."
        )
    print(f"PASS: apex A records use approved GitHub Pages targets: {sorted(a_records)}")

    aaaa = lookup("AAAA")
    if not aaaa.issubset(ALLOWED_AAAA):
        raise RuntimeError(f"Unexpected apex IPv6 targets: {sorted(aaaa)}")
    print("PASS: any apex AAAA records use approved GitHub Pages targets")


def check_certificate() -> None:
    context = ssl.create_default_context()
    with socket.create_connection((HOST, 443), timeout=15) as sock:
        with context.wrap_socket(sock, server_hostname=HOST) as tls:
            cert = tls.getpeercert()
            if not cert or "notAfter" not in cert:
                raise RuntimeError("Could not inspect a trusted TLS certificate")
            expires = dt.datetime.fromtimestamp(
                ssl.cert_time_to_seconds(cert["notAfter"]), tz=dt.timezone.utc
            )
            days_left = (expires - dt.datetime.now(dt.timezone.utc)).total_seconds() / 86400
            if days_left < MIN_CERT_VALIDITY_DAYS:
                raise RuntimeError(
                    f"DTW HTTPS certificate expires in {days_left:.1f} days "
                    f"({expires.isoformat()}); investigate renewal."
                )
            print(
                f"PASS: trusted certificate for {HOST}; TLS {tls.version()}; "
                f"expires {expires.date().isoformat()} ({days_left:.1f} days remaining)"
            )


def check_http_redirect() -> None:
    # HEAD is read-only; the default HTTPS handler also validates the final
    # certificate and hostname against the system trust store.
    req = Request("http://" + HOST + "/", method="HEAD",
                  headers={"User-Agent": "DTW-security-monitor/1.0"})
    with urlopen(req, timeout=25) as response:
        final_url = response.geturl()
        final = urlsplit(final_url)
        if response.status != 200 or final.scheme != "https" or final.hostname != HOST:
            raise RuntimeError(
                f"Insecure or unexpected canonical redirect: HTTP "
                f"{response.status}, final URL {final_url}"
            )
    print("PASS: HTTP homepage redirects to the expected HTTPS canonical domain")


if __name__ == "__main__":
    check_dns()
    check_certificate()
    check_http_redirect()
    print("PASS: DTW public DNS, TLS and HTTPS redirect checks")
