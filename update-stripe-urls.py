#!/usr/bin/env python3
"""
Update Stripe Payment Links with new success/cancel URLs
Usage: python3 update-stripe-urls.py <STRIPE_API_KEY> <STARTER_LINK_ID> <PRO_LINK_ID> <DOMAIN>
"""

import stripe
import sys

def update_payment_links(api_key, starter_link_id, pro_link_id, domain):
    """Update both payment links with new success/cancel URLs"""

    stripe.api_key = api_key

    success_url = f"{domain}/success?session_id=" + "{CHECKOUT_SESSION_ID}"
    cancel_url = f"{domain}/cancel"

    print(f"Updating Stripe Payment Links for domain: {domain}\n")
    print(f"Success URL: {success_url}")
    print(f"Cancel URL:  {cancel_url}\n")

    try:
        # Update Starter link
        print(f"1. Updating Starter link ({starter_link_id})...")
        starter = stripe.PaymentLink.modify(
            starter_link_id,
            after_completion={
                "type": "redirect",
                "redirect": {
                    "url": success_url
                }
            },
            metadata={
                "cancel_url": cancel_url
            }
        )
        print(f"   ✓ Starter link updated")

        # Update Pro link
        print(f"2. Updating Pro link ({pro_link_id})...")
        pro = stripe.PaymentLink.modify(
            pro_link_id,
            after_completion={
                "type": "redirect",
                "redirect": {
                    "url": success_url
                }
            },
            metadata={
                "cancel_url": cancel_url
            }
        )
        print(f"   ✓ Pro link updated")

        print("\n" + "="*60)
        print("SUCCESS: Payment links updated!")
        print("="*60)
        print(f"\nStarter: {starter.url}")
        print(f"Pro:     {pro.url}")
        print(f"\nUsers will now be redirected to:")
        print(f"  Success: {domain}/success")
        print(f"  Cancel:  {domain}/cancel")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python3 update-stripe-urls.py <STRIPE_API_KEY> <STARTER_LINK_ID> <PRO_LINK_ID> <DOMAIN>")
        print("\nExample:")
        print("  python3 update-stripe-urls.py sk_live_xxx plink_xxx plink_yyy https://e937fb4b.coldcopy-au3.pages.dev")
        sys.exit(1)

    api_key = sys.argv[1]
    starter_link_id = sys.argv[2]
    pro_link_id = sys.argv[3]
    domain = sys.argv[4]

    update_payment_links(api_key, starter_link_id, pro_link_id, domain)
